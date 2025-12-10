/**
 * @module services/stripe
 * @description Stripe payment service
 * @since 2025-11-21
 */

import Stripe from 'stripe';
import { OrderStatus, type PromoCode } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { TierType } from '../config/pricing.js';
import { getTierPricingMap } from './pricing.service.js';
import { calculateShipping } from '../config/shipping.js';
import { getPrintfulVariantId } from './printful.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendPromptGuide } from './email.service.js';
import { sendAnalyticsEvent } from './analytics.service.js';
import { sendOrderConfirmation, sendGiftCodeEmail } from './email.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Use Stripe's default version to avoid invalid pin failures; set STRIPE_API_VERSION env if you need a specific one.
  apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined,
});

interface CheckoutItem {
  productId: string;
  size: string;
  color: string;
  tier: 'BASIC' | 'PREMIUM' | 'TEST';
  quantity: number;
}

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
}

interface CheckoutSessionData {
  userId: string;
  items?: CheckoutItem[];
  shippingAddress: ShippingAddress;
  successUrl: string;
  cancelUrl: string;
  code?: string;
}

interface GiftCodeSessionData {
  userId: string;
  tier: TierType;
  usageLimit?: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create Stripe checkout session
 * @param {CheckoutSessionData & { orderId?: string }} data - Checkout data
 * @returns {Promise<{sessionId: string, url: string, orderId: string}>} Checkout session + order id
 */
export async function createCheckoutSession(
  data: CheckoutSessionData & { orderId?: string }
): Promise<{ sessionId: string; url: string; orderId: string; freeOrder?: boolean }> {
  const { userId, items, shippingAddress, successUrl, cancelUrl, code, orderId } = data;

  const tierPricingMap = await getTierPricingMap();
  const shippingAmount = calculateShipping(shippingAddress);

  let existingOrder: any = null;

  if (orderId) {
    existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, promoCode: true },
    });

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    if (existingOrder.userId !== userId) {
      throw new AppError('Unauthorized access to this order', 403);
    }

    if (
      existingOrder.status === OrderStatus.PAID ||
      existingOrder.status === OrderStatus.REFUNDED ||
      existingOrder.status === OrderStatus.CANCELLED ||
      existingOrder.status === OrderStatus.SUBMITTED ||
      existingOrder.status === OrderStatus.SHIPPED ||
      existingOrder.status === OrderStatus.DELIVERED
    ) {
      throw new AppError('This order has already been processed.', 400);
    }

    if (!existingOrder.items.length) {
      throw new AppError('Order has no items to checkout.', 400);
    }
  }

  let normalizedItems: Array<CheckoutItem & { orderItemId?: string }> = [];

  if (existingOrder) {
    normalizedItems = existingOrder.items.map((item: any) => ({
      productId: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      tier: (existingOrder.designTier as TierType) || TierType.BASIC,
      orderItemId: item.id,
    }));
  } else {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Cart items are required', 400);
    }

    normalizedItems = items.map((item) => ({
      productId: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      tier: (item.tier as TierType) || TierType.BASIC,
    }));
  }

  const uniqueTiers = Array.from(new Set(normalizedItems.map((item) => item.tier)));
  if (uniqueTiers.length !== 1) {
    throw new AppError('All items must use the same tier for checkout.', 400);
  }

  const orderTier = uniqueTiers[0] as TierType;
  if (!Object.values(TierType).includes(orderTier)) {
    throw new AppError('Invalid tier selection.', 400);
  }

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const validatedItems = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(`Invalid product: ${item.productId}`, 400);
    }

    const colorOptions = Array.isArray(product.colors)
      ? (product.colors as Array<{ name: string }>)
      : [];
    const matchedColor =
      colorOptions.find((c) => c?.name?.toLowerCase() === item.color.toLowerCase()) || colorOptions[0];

    if (!matchedColor) {
      throw new AppError(`Selected color unavailable for ${product.name}`, 400);
    }

    const matchedSize =
      product.sizes.find((s) => s.toLowerCase() === item.size.toLowerCase()) || product.sizes[0];

    if (!matchedSize) {
      throw new AppError(`Selected size unavailable for ${product.name}`, 400);
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    const tierConfig = tierPricingMap[item.tier as TierType];
    if (!tierConfig) {
      throw new AppError('Tier configuration missing', 500);
    }

    const unitPrice = Number(product.basePrice) + tierConfig.price;

    const variantId = getPrintfulVariantId(product.printfulId, matchedColor.name, matchedSize);
    if (!variantId) {
      throw new AppError(
        `Selected variant unavailable: ${product.name} (${matchedColor.name} / ${matchedSize}). Please choose a supported color/size.`,
        400
      );
    }

    return {
      product,
      unitPrice,
      tierConfig,
      variantId,
      payload: {
        ...item,
        color: matchedColor.name,
        size: matchedSize,
      },
    };
  });

  // Optional promo/gift code validation
  let promoCode: PromoCode | null = null;
  const trimmedCode = code ? code.trim() : '';

  if (trimmedCode) {
    const lookup = await prisma.promoCode.findFirst({
      where: { code: trimmedCode, disabled: false },
    });
    if (!lookup) {
      throw new AppError('Invalid or unknown promo code.', 400);
    }
    if (
      lookup.usageLimit !== null &&
      lookup.usageLimit !== undefined &&
      lookup.usageCount >= lookup.usageLimit
    ) {
      throw new AppError('This promo code has already been redeemed the maximum number of times.', 400);
    }

    promoCode = lookup;
  } else if (existingOrder?.promoCode) {
    if (existingOrder.promoCode.disabled) {
      throw new AppError('This promo code is no longer active.', 400);
    }
    promoCode = existingOrder.promoCode;
  }

  let adjustedItems = validatedItems;

  if (promoCode) {
    if (promoCode.type === 'FREE_PRODUCT') {
      if (adjustedItems.length !== 1) {
        throw new AppError('This gift code is valid for a single tee. Please leave only one item in your cart.', 400);
      }
      const item = adjustedItems[0];
      if (promoCode.productTier && promoCode.productTier !== item.payload.tier) {
        throw new AppError(`This gift code is only valid for a ${promoCode.productTier} tee.`, 400);
      }
      // Make the product free; shipping still applies.
      adjustedItems = [
        {
          ...item,
          unitPrice: 0,
        },
      ];
    } else if (promoCode.type === 'PERCENT_OFF') {
      if (!promoCode.percentOff || promoCode.percentOff <= 0) {
        throw new AppError('Promo code is missing a discount amount.', 400);
      }
      const percent = Math.min(promoCode.percentOff, 100);
      const factor = (100 - percent) / 100;
      adjustedItems = adjustedItems.map((item) => ({
        ...item,
        unitPrice: item.unitPrice * factor,
      }));
    }
  }

  const itemsTotal = adjustedItems.reduce(
    (total, item) => total + item.unitPrice * item.payload.quantity,
    0
  );
  const totalAmount = itemsTotal + shippingAmount;

  // Generate unique order number
  const orderNumber =
    existingOrder?.orderNumber ||
    `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create / upsert shipping address
  const address = await prisma.address.create({
    data: {
      userId,
      name: shippingAddress.name,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || null,
      city: shippingAddress.city,
      state: shippingAddress.state || null,
      zip: shippingAddress.zip,
      country: shippingAddress.country || 'US',
      phone: shippingAddress.phone || null,
      isDefault: false,
    },
  });

  // Helper to sync item pricing/variants when reusing an order
  const persistExistingItems = async () => {
    if (!existingOrder) return;
    if (adjustedItems.some((item) => !item.payload.orderItemId)) {
      throw new AppError('Unable to reuse this order because item IDs are missing.', 400);
    }
    await Promise.all(
      adjustedItems.map((item) =>
        prisma.orderItem.update({
          where: { id: item.payload.orderItemId! },
          data: {
            productId: item.payload.productId,
            size: item.payload.size,
            color: item.payload.color,
            quantity: item.payload.quantity,
            unitPrice: item.unitPrice,
            printfulVariantId: item.variantId?.toString(),
          },
        })
      )
    );
  };

  // $0 orders: skip Stripe and mark paid immediately
  if (totalAmount <= 0) {
    if (existingOrder) {
      await persistExistingItems();
      const paidOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          totalAmount: 0,
          designTier: orderTier,
          maxDesigns: tierPricingMap[orderTier].maxDesigns,
          addressId: address.id,
          promoCodeId: promoCode?.id || null,
          payment: {
            create: {
              stripePaymentId: `free_${orderNumber}`,
              amount: 0,
              currency: 'usd',
              status: 'COMPLETED',
              paymentMethod: 'free',
            },
          },
        },
        include: { user: true, items: true, address: true },
      });

      if (promoCode?.id) {
        await incrementPromoUsage(promoCode.id);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      sendOrderConfirmation({
        customerName: paidOrder.user.firstName || paidOrder.user.email,
        customerEmail: paidOrder.user.email,
        orderNumber: paidOrder.orderNumber,
        orderTotal: paidOrder.totalAmount.toString(),
        tier: paidOrder.designTier,
        itemCount: paidOrder.items.length,
        orderUrl: `${frontendUrl}/design?orderId=${paidOrder.id}`,
      }).catch((error) => console.error('Failed to send order confirmation email:', error));

      sendPromptGuide({
        customerName: paidOrder.user.firstName || paidOrder.user.email,
        customerEmail: paidOrder.user.email,
        orderNumber: paidOrder.orderNumber,
        orderUrl: `${frontendUrl}/design?orderId=${paidOrder.id}`,
      }).catch((error) => console.error('Failed to send prompt guide email:', error));

      return {
        sessionId: '',
        url: '',
        orderId: paidOrder.id,
        freeOrder: true,
      };
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PAID,
        paidAt: new Date(),
        totalAmount: 0,
        designTier: orderTier,
        maxDesigns: adjustedItems[0].tierConfig.maxDesigns,
        designsGenerated: 0,
        addressId: address.id,
        promoCodeId: promoCode?.id || null,
        items: {
          create: adjustedItems.map(({ payload, unitPrice, variantId }) => ({
            productId: payload.productId,
            size: payload.size,
            color: payload.color,
            quantity: payload.quantity,
            unitPrice,
            printfulVariantId: variantId?.toString(),
          })),
        },
        payment: {
          create: {
            stripePaymentId: `free_${orderNumber}`,
            amount: 0,
            currency: 'usd',
            status: 'COMPLETED',
            paymentMethod: 'free',
          },
        },
      },
      include: { user: true, items: true, address: true },
    });

    if (promoCode?.id) {
      await incrementPromoUsage(promoCode.id);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    sendOrderConfirmation({
      customerName: order.user.firstName || order.user.email,
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      orderTotal: order.totalAmount.toString(),
      tier: order.designTier,
      itemCount: order.items.length,
      orderUrl: `${frontendUrl}/design?orderId=${order.id}`,
    }).catch((error) => console.error('Failed to send order confirmation email:', error));

    sendPromptGuide({
      customerName: order.user.firstName || order.user.email,
      customerEmail: order.user.email,
      orderNumber: order.orderNumber,
      orderUrl: `${frontendUrl}/design?orderId=${order.id}`,
    }).catch((error) => console.error('Failed to send prompt guide email:', error));

    return {
      sessionId: '',
      url: '',
      orderId: order.id,
      freeOrder: true,
    };
  }

  // Create or reuse order in database with PENDING_PAYMENT status
  let order =
    existingOrder ||
    (await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount,
        designTier: orderTier,
        maxDesigns: adjustedItems[0].tierConfig.maxDesigns,
        designsGenerated: 0,
        addressId: address.id,
        promoCodeId: promoCode?.id || null,
        items: {
          create: adjustedItems.map(({ payload, unitPrice, variantId }) => ({
            productId: payload.productId,
            size: payload.size,
            color: payload.color,
            quantity: payload.quantity,
            unitPrice,
            printfulVariantId: variantId?.toString(),
          })),
        },
      },
      include: {
        items: true,
      },
    }));

  if (existingOrder) {
    await persistExistingItems();
    order = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        totalAmount,
        addressId: address.id,
        designTier: orderTier,
        maxDesigns: adjustedItems[0].tierConfig.maxDesigns,
        promoCodeId: promoCode?.id || null,
      },
      include: { items: true },
    });
  }

  // Create Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = adjustedItems.map(
    ({ payload, product, unitPrice }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${product.name} - ${payload.tier}`,
          description: `Size: ${payload.size}, Color: ${payload.color}`,
        },
        unit_amount: Math.round(unitPrice * 100), // Convert to cents
      },
      quantity: payload.quantity,
    })
  );

  // Add shipping as a separate line item to keep parity between Stripe and DB totals
  if (shippingAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
          description: 'Flat-rate shipping',
        },
        unit_amount: Math.round(shippingAmount * 100),
      },
      quantity: 1,
    });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU'],
    },
    line_items: lineItems,
    mode: 'payment',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      addressId: address.id,
      tier: orderTier,
      shippingAmount: shippingAmount.toString(),
      ...(promoCode?.id ? { promoCodeId: promoCode.id, promoCodeCode: promoCode.code } : {}),
    },
  });

  // Store checkout session ID in order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeCheckoutId: session.id, totalAmount },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
    orderId: order.id,
  };
}

/**
 * Create Stripe checkout session for purchasing a gift code.
 */
export async function createGiftCodeSession(
  data: GiftCodeSessionData
): Promise<{ sessionId: string; url: string }> {
  const { userId, tier, usageLimit = 1, successUrl, cancelUrl } = data;
  const tierPricingMap = await getTierPricingMap();

  // Use first active product to derive base price; fall back to zero.
  const product = await prisma.product.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const basePrice = product ? Number(product.basePrice) : 0;
  const tierPrice = tierPricingMap[tier].price;
  const unitPrice = basePrice + tierPrice;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Gift Code - ${tier === 'PREMIUM' ? 'Limitless Tee' : 'Classic Tee'}`,
            description: usageLimit === 1 ? 'Single-use gift code' : `Gift code (${usageLimit} uses)`,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      giftCodeType: tier,
      giftCodeUses: usageLimit.toString(),
      userId,
    },
  });

  return { sessionId: session.id, url: session.url || '' };
}

/**
 * Handle successful gift code purchase webhook.
 */
export async function handleGiftCodePurchase(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const tier = session.metadata?.giftCodeType as TierType | undefined;
  if (!tier || !Object.values(TierType).includes(tier)) {
    throw new Error('Missing or invalid giftCodeType in metadata');
  }

  const usageLimit = session.metadata?.giftCodeUses ? parseInt(session.metadata.giftCodeUses, 10) : 1;
  const userId = session.metadata?.userId || null;

  const deterministicCode = crypto
    .createHash('sha256')
    .update(session.id || crypto.randomUUID())
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();

  let createdCode: string | null = null;
  try {
    await prisma.promoCode.create({
      data: {
        code: deterministicCode,
        type: 'FREE_PRODUCT',
        productTier: tier,
        percentOff: null,
        usageLimit: Number.isFinite(usageLimit) ? usageLimit : null,
        usageCount: 0,
        createdByUserId: userId,
      },
    });
    createdCode = deterministicCode;
  } catch (error: any) {
    const isUniqueError = error?.code === 'P2002';
    if (!isUniqueError) {
      throw error;
    }
    // Idempotency: fetch existing code if already created
    const existing = await prisma.promoCode.findUnique({ where: { code: deterministicCode } });
    createdCode = existing?.code || null;
  }

  if (!createdCode) {
    throw new Error('Failed to generate a unique gift code');
  }

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      sendGiftCodeEmail({
        customerName: user.firstName || user.email,
        customerEmail: user.email,
        code: createdCode,
        tier,
        usageLimit: Number.isFinite(usageLimit) ? usageLimit : null,
        redeemUrl: `${frontendUrl}/shop`,
      }).catch((err) => console.error('Failed to send gift code email:', err));
    }
  }
}

/**
 * Handle successful payment
 * @param {string} sessionId - Stripe session ID
 */
export async function handleSuccessfulPayment(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) {
    throw new Error('Order ID not found in session metadata');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true, address: true, promoCode: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'PAID') {
    console.log(`Order ${orderId} already marked as PAID; skipping duplicate webhook.`);
    return;
  }

  if (session.client_reference_id && session.client_reference_id !== order.id) {
    throw new Error('Stripe session client_reference_id does not match order');
  }
  if (session.metadata?.userId && session.metadata.userId !== order.userId) {
    throw new Error('Stripe session user does not match order owner');
  }

  const sessionTotal = (session.amount_total || 0) / 100;
  const orderTotal = Number(order.totalAmount);
  const currency = (session.currency || '').toLowerCase();
  if (currency && currency !== 'usd') {
    throw new Error(`Unexpected currency: ${currency}`);
  }
  if (Math.abs(sessionTotal - orderTotal) > 0.01) {
    throw new Error(`Payment amount mismatch. Expected ${orderTotal}, got ${sessionTotal}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      payment: {
        create: {
          stripePaymentId: session.payment_intent as string,
          amount: sessionTotal,
          currency: session.currency || 'usd',
          status: 'COMPLETED',
          paymentMethod: session.payment_method_types?.[0] || 'card',
        },
      },
    },
    include: {
      user: true,
      items: true,
      address: true,
    },
  });

  console.log(`Order ${orderId} marked as PAID`);

  if (updatedOrder.promoCodeId) {
    await incrementPromoUsage(updatedOrder.promoCodeId);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  sendOrderConfirmation({
    customerName: updatedOrder.user.firstName || updatedOrder.user.email,
    customerEmail: updatedOrder.user.email,
    orderNumber: updatedOrder.orderNumber,
    orderTotal: updatedOrder.totalAmount.toString(),
    tier: updatedOrder.designTier,
    itemCount: updatedOrder.items.length,
    orderUrl: `${frontendUrl}/design?orderId=${updatedOrder.id}`,
  }).catch((error) => {
    console.error('Failed to send order confirmation email:', error);
  });

  sendPromptGuide({
    customerName: updatedOrder.user.firstName || updatedOrder.user.email,
    customerEmail: updatedOrder.user.email,
    orderNumber: updatedOrder.orderNumber,
    orderUrl: `${frontendUrl}/design?orderId=${updatedOrder.id}`,
  }).catch((error) => {
    console.error('Failed to send prompt guide email:', error);
  });

  sendAnalyticsEvent({
    event: 'order.paid',
    properties: {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      amount: updatedOrder.totalAmount,
      tier: updatedOrder.designTier,
      item_count: updatedOrder.items.length,
      country: updatedOrder.address?.country || 'US',
    },
  });
}


/**
 * Manually confirm a checkout session and mark the order as paid
 * Useful when the Stripe webhook didn't fire
 */
export async function confirmCheckoutSession(
  sessionId: string,
  orderId: string,
  requesterId?: string
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  if (requesterId && order.userId !== requesterId) {
    throw new Error('Unauthorized to confirm this order');
  }

  // Ensure the session belongs to this order/user
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id && session.client_reference_id !== orderId) {
    throw new Error('Session does not belong to this order');
  }
  if (session.metadata?.orderId && session.metadata.orderId !== orderId) {
    throw new Error('Session metadata does not match this order');
  }
  if (session.metadata?.userId && session.metadata.userId !== order.userId) {
    throw new Error('Session user does not match order owner');
  }

  // If already paid, no-op
  if (order.status === 'PAID') {
    return;
  }

  await handleSuccessfulPayment(sessionId);
}

/**
 * Construct Stripe webhook event
 * @param {string | Buffer} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @returns {Stripe.Event} Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Atomically increment promo usage, enforcing usageLimit when present.
 */
async function incrementPromoUsage(promoCodeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.findUnique({ where: { id: promoCodeId } });
    if (!promo) {
      throw new Error('Promo code not found');
    }
    if (
      promo.usageLimit !== null &&
      promo.usageLimit !== undefined &&
      promo.usageCount >= promo.usageLimit
    ) {
      throw new Error('Promo code usage limit exceeded');
    }
    await tx.promoCode.update({
      where: { id: promoCodeId },
      data: { usageCount: { increment: 1 } },
    });
  });
}

export default stripe;

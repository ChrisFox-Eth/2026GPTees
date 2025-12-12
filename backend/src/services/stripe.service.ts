/**
 * @module services/stripe
 * @description Stripe payment service for checkout sessions, payment processing, webhooks, and gift code purchases. Handles order creation, payment confirmation, promo code validation, and automatic design approval after payment.
 * @since 2025-11-21
 */

import Stripe from 'stripe';
import { OrderStatus, type PromoCode } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { TierType } from '../config/pricing.js';
import { getTierPricingMap } from './pricing.service.js';
import { calculateShipping } from '../config/shipping.js';
import { getPrintfulVariantId, createPrintfulOrder } from './printful.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendPromptGuide } from './email.service.js';
import { sendAnalyticsEvent } from './analytics.service.js';
import { sendOrderConfirmation, sendGiftCodeEmail } from './email.service.js';
import { getOrderActionErrorMessage, isOrderActionAllowed } from '../policies/order-policy.js';

/**
 * Stripe client instance configured with API key and version
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Use Stripe's default version to avoid invalid pin failures; set STRIPE_API_VERSION env if you need a specific one.
  apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined,
});

/**
 * Checkout item interface
 * @interface CheckoutItem
 */
interface CheckoutItem {
  productId: string;
  size: string;
  color: string;
  tier: TierType;
  quantity: number;
}

/**
 * Shipping address interface
 * @interface ShippingAddress
 */
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

/**
 * Checkout session data interface
 * @interface CheckoutSessionData
 */
interface CheckoutSessionData {
  userId: string;
  items?: CheckoutItem[];
  shippingAddress: ShippingAddress;
  successUrl: string;
  cancelUrl: string;
  code?: string;
}

/**
 * Gift code session data interface
 * @interface GiftCodeSessionData
 */
interface GiftCodeSessionData {
  userId: string;
  tier: TierType;
  usageLimit?: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * @function createCheckoutSession
 * @description Creates Stripe checkout session for product purchase. Handles order creation/resumption, promo code validation, free order processing, and variant mapping. Supports $0 orders by bypassing Stripe and marking as paid immediately.
 *
 * @param {CheckoutSessionData & {orderId?: string}} data - Checkout session data
 * @param {string} data.userId - User ID for the order
 * @param {CheckoutItem[]} [data.items] - Cart items (required for new orders)
 * @param {ShippingAddress} data.shippingAddress - Shipping address
 * @param {string} data.successUrl - Success redirect URL
 * @param {string} data.cancelUrl - Cancel redirect URL
 * @param {string} [data.code] - Optional promo/gift code
 * @param {string} [data.orderId] - Optional existing order ID to resume
 *
 * @returns {Promise<{sessionId: string, url: string, orderId: string, freeOrder?: boolean}>} Checkout session details
 * @returns {string} sessionId - Stripe session ID (empty for free orders)
 * @returns {string} url - Stripe checkout URL (empty for free orders)
 * @returns {string} orderId - Internal order ID
 * @returns {boolean} [freeOrder] - True if order was $0 and processed without Stripe
 *
 * @throws {AppError} When order not found, already processed, or validation fails
 * @throws {AppError} When promo code is invalid or exhausted
 * @throws {AppError} When product/variant is unavailable
 *
 * @example
 * const session = await createCheckoutSession({
 *   userId: 'user-123',
 *   items: [{ productId: 'prod-1', size: 'L', color: 'Black', tier: 'LIMITLESS', quantity: 1 }],
 *   shippingAddress: { name: 'John Doe', address1: '123 Main St', ... },
 *   successUrl: 'https://example.com/success',
 *   cancelUrl: 'https://example.com/cancel',
 *   code: 'GIFT123'
 * });
 *
 * @async
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
      include: { items: true, promoCode: true, user: true, address: true },
    });

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    if (existingOrder.userId !== userId) {
      throw new AppError('Unauthorized access to this order', 403);
    }

    if (!isOrderActionAllowed('order_checkout', existingOrder.status as OrderStatus)) {
      throw new AppError(getOrderActionErrorMessage('order_checkout'), 400);
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
      tier: TierType.LIMITLESS,
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
      tier: TierType.LIMITLESS,
    }));
  }

  const orderTier = TierType.LIMITLESS;

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)));
  const products = (await prisma.product.findMany({
    where: { id: { in: productIds } },
  })) as any[];
  const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

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
      product.sizes.find((s: string) => s.toLowerCase() === item.size.toLowerCase()) || product.sizes[0];

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

    const unitPrice = tierConfig.price;

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
          designTier: orderTier as any,
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
        designTier: orderTier as any,
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
        designTier: orderTier as any,
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
        designTier: orderTier as any,
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
 * @function createGiftCodeSession
 * @description Creates Stripe checkout session for purchasing a gift code. Gift codes can be redeemed for free products up to the usage limit.
 *
 * @param {GiftCodeSessionData} data - Gift code session data
 * @param {string} data.userId - User ID purchasing the gift code
 * @param {TierType} data.tier - Product tier the gift code is valid for
 * @param {number} [data.usageLimit=1] - Maximum number of times code can be used
 * @param {string} data.successUrl - Success redirect URL
 * @param {string} data.cancelUrl - Cancel redirect URL
 *
 * @returns {Promise<{sessionId: string, url: string}>} Stripe checkout session
 * @returns {string} sessionId - Stripe session ID
 * @returns {string} url - Stripe checkout URL
 *
 * @example
 * const session = await createGiftCodeSession({
 *   userId: 'user-123',
 *   tier: 'LIMITLESS',
 *   usageLimit: 1,
 *   successUrl: 'https://example.com/success',
 *   cancelUrl: 'https://example.com/cancel'
 * });
 *
 * @async
 */
export async function createGiftCodeSession(
  data: GiftCodeSessionData
): Promise<{ sessionId: string; url: string }> {
  const { userId, tier, usageLimit = 1, successUrl, cancelUrl } = data;
  const tierPricingMap = await getTierPricingMap();

  const tierPrice = tierPricingMap[tier].price;
  const unitPrice = tierPrice;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
          name: 'Gift Code - Limitless Tee',
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
 * @function handleGiftCodePurchase
 * @description Processes successful gift code purchase from Stripe webhook. Creates promo code in database and sends email with code to purchaser. Ensures idempotency for duplicate webhook calls.
 *
 * @param {Stripe.Checkout.Session} session - Stripe checkout session from webhook
 * @param {string} session.metadata.giftCodeType - Tier the gift code is valid for
 * @param {string} session.metadata.giftCodeUses - Usage limit for the code
 * @param {string} [session.metadata.userId] - User ID who purchased the code
 *
 * @returns {Promise<void>} Resolves when code is created and email sent
 *
 * @throws {Error} When payment not completed or metadata missing/invalid
 * @throws {Error} When code creation fails (non-duplicate errors)
 *
 * @example
 * await handleGiftCodePurchase(stripeSession);
 *
 * @async
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
 * @function handleSuccessfulPayment
 * @description Processes successful payment from Stripe webhook. Marks order as paid, creates payment record, auto-approves latest design, increments promo usage, sends confirmation emails, and tracks analytics.
 *
 * @param {string} sessionId - Stripe checkout session ID
 *
 * @returns {Promise<void>} Resolves when payment is processed
 *
 * @throws {Error} When payment not completed
 * @throws {Error} When order ID missing from session metadata
 * @throws {Error} When order not found
 * @throws {Error} When session/order validation fails (user mismatch, amount mismatch, etc.)
 *
 * @example
 * await handleSuccessfulPayment('cs_test_123abc');
 *
 * @async
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

  await autoApproveLatestDesign(updatedOrder.id);

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
 * @function autoApproveLatestDesign
 * @description Automatically approves the latest completed design after payment and submits order to Printful. Prevents duplicate submissions and ensures only one design is approved at a time.
 *
 * @param {string} orderId - Order ID to auto-approve design for
 *
 * @returns {Promise<void>} Resolves when design approved and order submitted (or skipped)
 *
 * @async
 */
async function autoApproveLatestDesign(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      designs: true,
      items: true,
    },
  });

  if (!order || !order.designs.length) {
    return;
  }

  if (
    order.printfulOrderId ||
    order.status === OrderStatus.SUBMITTED ||
    order.status === OrderStatus.SHIPPED ||
    order.status === OrderStatus.DELIVERED
  ) {
    return;
  }

  const latestCompleted = order.designs
    .filter((d: any) => d.status === 'COMPLETED')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!latestCompleted) {
    return;
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.design.updateMany({
      where: { orderId },
      data: { approvalStatus: false, approvedAt: null },
    });

    await tx.design.update({
      where: { id: latestCompleted.id },
      data: {
        approvalStatus: true,
        approvedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'DESIGN_APPROVED',
        items: {
          updateMany: {
            where: { orderId },
            data: {
              designId: latestCompleted.id,
            },
          },
        },
      },
    });
  });

  try {
    await createPrintfulOrder(orderId, latestCompleted.id);
  } catch (err) {
    console.error(`Failed to submit order ${orderId} to Printful after auto-approve:`, err);
  }
}

/**
 * @function confirmCheckoutSession
 * @description Manually confirms checkout session and processes payment. Useful when Stripe webhook didn't fire or for manual order confirmation. Validates session ownership before processing.
 *
 * @param {string} sessionId - Stripe checkout session ID
 * @param {string} orderId - Internal order ID
 * @param {string} [requesterId] - User ID making the request (for authorization)
 *
 * @returns {Promise<void>} Resolves when session confirmed and payment processed
 *
 * @throws {Error} When order not found
 * @throws {Error} When requester is not order owner
 * @throws {Error} When session doesn't belong to order
 * @throws {Error} When session/order validation fails
 *
 * @example
 * await confirmCheckoutSession('cs_test_123', 'order-456', 'user-789');
 *
 * @async
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
 * @function constructWebhookEvent
 * @description Constructs and verifies Stripe webhook event using signature. Ensures webhook authenticity and prevents replay attacks.
 *
 * @param {string | Buffer} payload - Raw webhook payload
 * @param {string} signature - Stripe signature from headers
 *
 * @returns {Stripe.Event} Verified Stripe event
 *
 * @throws {Error} When STRIPE_WEBHOOK_SECRET not configured
 * @throws {Error} When signature verification fails
 *
 * @example
 * const event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
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
 * @function incrementPromoUsage
 * @description Atomically increments promo code usage count with transaction safety. Enforces usage limit if present.
 *
 * @param {string} promoCodeId - Promo code ID to increment
 *
 * @returns {Promise<void>} Resolves when usage incremented
 *
 * @throws {Error} When promo code not found
 * @throws {Error} When usage limit exceeded
 *
 * @async
 */
async function incrementPromoUsage(promoCodeId: string): Promise<void> {
  await prisma.$transaction(async (tx: any) => {
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

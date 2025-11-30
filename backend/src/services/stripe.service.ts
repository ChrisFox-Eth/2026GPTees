/**
 * @module services/stripe
 * @description Stripe payment service
 * @since 2025-11-21
 */

import Stripe from 'stripe';
import type { PromoCode } from '@prisma/client';
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
  tier: 'BASIC' | 'PREMIUM';
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
  items: CheckoutItem[];
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
 * @param {CheckoutSessionData} data - Checkout data
 * @returns {Promise<{sessionId: string, url: string, orderId: string}>} Checkout session + order id
 */
export async function createCheckoutSession(
  data: CheckoutSessionData
): Promise<{ sessionId: string; url: string; orderId: string; freeOrder?: boolean }> {
  const { userId, items, shippingAddress, successUrl, cancelUrl, code } = data;

  const tierPricingMap = await getTierPricingMap();
  const shippingAmount = calculateShipping(shippingAddress);

  // Load products from DB to prevent client-side price tampering
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate items and prepare payload
  let validatedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Invalid product: ${item.productId}`);
    }

    const tierConfig = tierPricingMap[item.tier as TierType];
    const unitPrice = Number(product.basePrice) + tierConfig.price;

    const variantId = getPrintfulVariantId(product.printfulId, item.color, item.size);
    if (!variantId) {
      throw new AppError(
        `Selected variant unavailable: ${product.name} (${item.color} / ${item.size}). Please choose a supported color/size.`,
        400
      );
    }

    return {
      product,
      unitPrice,
      tierConfig,
      payload: item,
      variantId,
    };
  });

  // Optional promo/gift code validation
  let promoCode: PromoCode | null = null;
  if (code) {
    const lookup = await prisma.promoCode.findFirst({
      where: { code: code.trim(), disabled: false },
    });
    if (!lookup) {
      throw new AppError('Invalid or unknown promo code.', 400);
    }
    if (lookup.usageLimit !== null && lookup.usageLimit !== undefined && lookup.usageCount >= lookup.usageLimit) {
      throw new AppError('This promo code has already been redeemed the maximum number of times.', 400);
    }

    promoCode = lookup;

    if (promoCode.type === 'FREE_PRODUCT') {
      if (validatedItems.length !== 1) {
        throw new AppError('This gift code is valid for a single tee. Please leave only one item in your cart.', 400);
      }
      const item = validatedItems[0];
      if (promoCode.productTier && promoCode.productTier !== item.payload.tier) {
        throw new AppError(`This gift code is only valid for a ${promoCode.productTier} tee.`, 400);
      }
      // Make the product free; shipping still applies.
      validatedItems = [
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
      validatedItems = validatedItems.map((item) => ({
        ...item,
        unitPrice: item.unitPrice * factor,
      }));
    }
  }

  const itemsTotal = validatedItems.reduce(
    (total, item) => total + item.unitPrice * item.payload.quantity,
    0
  );
  const totalAmount = itemsTotal + shippingAmount;

  // Generate unique order number
  const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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

  // $0 orders: skip Stripe and mark paid immediately
  if (totalAmount <= 0) {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PAID',
        paidAt: new Date(),
        totalAmount: 0,
        designTier: items[0].tier,
        maxDesigns: validatedItems[0].tierConfig.maxDesigns,
        designsGenerated: 0,
        addressId: address.id,
        promoCodeId: promoCode?.id || null,
        items: {
          create: validatedItems.map(({ payload, unitPrice }) => ({
            productId: payload.productId,
            size: payload.size,
            color: payload.color,
            quantity: payload.quantity,
            unitPrice,
            printfulVariantId: validatedItems.find((v) => v.payload === payload)?.variantId?.toString(),
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
      await prisma.promoCode.update({
        where: { id: promoCode.id },
        data: { usageCount: { increment: 1 } },
      });
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

  // Create order in database with PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'PENDING_PAYMENT',
      totalAmount,
      designTier: items[0].tier,
      maxDesigns: validatedItems[0].tierConfig.maxDesigns,
      designsGenerated: 0,
      addressId: address.id,
      promoCodeId: promoCode?.id || null,
      items: {
        create: validatedItems.map(({ payload, unitPrice }) => ({
          productId: payload.productId,
          size: payload.size,
          color: payload.color,
          quantity: payload.quantity,
          unitPrice,
          printfulVariantId: validatedItems.find((v) => v.payload === payload)?.variantId?.toString(),
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // Create Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map(
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
      tier: items[0].tier,
      shippingAmount: shippingAmount.toString(),
      ...(promoCode?.id ? { promoCodeId: promoCode.id, promoCodeCode: promoCode.code } : {}),
    },
  });

  // Store checkout session ID in order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeCheckoutId: session.id },
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

  // Idempotency: if already marked paid, exit
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (existing?.status === 'PAID') {
    console.log(`Order ${orderId} already marked as PAID; skipping duplicate webhook.`);
    return;
  }

  // Update order status and get full order details
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      payment: {
        create: {
          stripePaymentId: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100,
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

  console.log(`✓ Order ${orderId} marked as PAID`);

  if (order.promoCodeId) {
    await prisma.promoCode.update({
      where: { id: order.promoCodeId },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Send order confirmation email (non-blocking)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  sendOrderConfirmation({
    customerName: order.user.firstName || order.user.email,
    customerEmail: order.user.email,
    orderNumber: order.orderNumber,
    orderTotal: order.totalAmount.toString(),
    tier: order.designTier,
    itemCount: order.items.length,
    orderUrl: `${frontendUrl}/design?orderId=${order.id}`,
  }).catch((error) => {
    console.error('Failed to send order confirmation email:', error);
    // Don't throw - email failure shouldn't break the payment flow
  });

  // Send prompt guidance to encourage design completion (non-blocking)
  sendPromptGuide({
    customerName: order.user.firstName || order.user.email,
    customerEmail: order.user.email,
    orderNumber: order.orderNumber,
    orderUrl: `${frontendUrl}/design?orderId=${order.id}`,
  }).catch((error) => {
    console.error('Failed to send prompt guide email:', error);
  });

  // Emit revenue event to optional analytics webhook
  sendAnalyticsEvent({
    event: 'order.paid',
    properties: {
      order_id: order.id,
      order_number: order.orderNumber,
      amount: order.totalAmount,
      tier: order.designTier,
      item_count: order.items.length,
      country: order.address?.country || 'US',
    },
  });
}

/**
 * Manually confirm a checkout session and mark the order as paid
 * Useful when the Stripe webhook didn't fire
 */
export async function confirmCheckoutSession(sessionId: string, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
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

export default stripe;

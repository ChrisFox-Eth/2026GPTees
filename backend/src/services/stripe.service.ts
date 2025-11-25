/**
 * @module services/stripe
 * @description Stripe payment service
 * @since 2025-11-21
 */

import Stripe from 'stripe';
import prisma from '../config/database.js';
import { TierType } from '../config/pricing.js';
import { getTierPricingMap } from './pricing.service.js';
import { calculateShipping } from '../config/shipping.js';
import { getPrintfulVariantId } from './printful.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendPromptGuide } from './email.service.js';
import { sendAnalyticsEvent } from './analytics.service.js';
import { sendOrderConfirmation } from './email.service.js';

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
}

/**
 * Create Stripe checkout session
 * @param {CheckoutSessionData} data - Checkout data
 * @returns {Promise<{sessionId: string, url: string, orderId: string}>} Checkout session + order id
 */
export async function createCheckoutSession(
  data: CheckoutSessionData
): Promise<{ sessionId: string; url: string; orderId: string }> {
  const { userId, items, shippingAddress, successUrl, cancelUrl } = data;

  const tierPricingMap = await getTierPricingMap();
  const shippingAmount = calculateShipping(shippingAddress);

  // Load products from DB to prevent client-side price tampering
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate totals and prepare order items
  let totalAmount = 0;
  const validatedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Invalid product: ${item.productId}`);
    }

    const tierConfig = tierPricingMap[item.tier as TierType];
    const unitPrice = Number(product.basePrice) + tierConfig.price;
    totalAmount += unitPrice * item.quantity;

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

  // Create order in database with PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'PENDING_PAYMENT',
      totalAmount: totalAmount + shippingAmount,
      designTier: items[0].tier,
      maxDesigns: validatedItems[0].tierConfig.maxDesigns,
      designsGenerated: 0,
      addressId: address.id,
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

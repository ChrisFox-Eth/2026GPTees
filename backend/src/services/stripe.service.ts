/**
 * @module services/stripe
 * @description Stripe payment service
 * @since 2025-11-21
 */

import Stripe from 'stripe';
import prisma from '../config/database.js';
import { getTierConfig, TierType } from '../config/pricing.js';
import { sendOrderConfirmation } from './email.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
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
 * @returns {Promise<{sessionId: string, url: string}>} Checkout session
 */
export async function createCheckoutSession(
  data: CheckoutSessionData
): Promise<{ sessionId: string; url: string }> {
  const { userId, items, shippingAddress, successUrl, cancelUrl } = data;

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

    const tierConfig = getTierConfig(item.tier as TierType);
    const unitPrice = Number(product.basePrice) + tierConfig.price;
    totalAmount += unitPrice * item.quantity;

    return {
      product,
      unitPrice,
      tierConfig,
      payload: item,
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
      totalAmount,
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

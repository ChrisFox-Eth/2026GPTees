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
  productName: string;
  size: string;
  color: string;
  tier: 'BASIC' | 'PREMIUM';
  quantity: number;
  basePrice: number;
  tierPrice: number;
}

interface CheckoutSessionData {
  userId: string;
  items: CheckoutItem[];
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
  const { userId, items, successUrl, cancelUrl } = data;

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.basePrice + item.tierPrice) * item.quantity;
  }, 0);

  // Generate unique order number
  const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Get tier config for first item (assuming single item orders for now)
  const tierConfig = getTierConfig(items[0].tier as TierType);

  // Create order in database with PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: 'PENDING_PAYMENT',
      totalAmount,
      designTier: items[0].tier,
      maxDesigns: tierConfig.maxDesigns,
      designsGenerated: 0,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.basePrice + item.tierPrice,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  // Create Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: `${item.productName} - ${item.tier}`,
        description: `Size: ${item.size}, Color: ${item.color}`,
      },
      unit_amount: Math.round((item.basePrice + item.tierPrice) * 100), // Convert to cents
    },
    quantity: item.quantity,
  }));

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: cancelUrl,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
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

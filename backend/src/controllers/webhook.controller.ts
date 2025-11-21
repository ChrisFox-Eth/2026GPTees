/**
 * @module controllers/webhook
 * @description Webhook controllers for external services
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { verifyClerkWebhook, syncUserToDatabase } from '../services/clerk.service.js';
import { constructWebhookEvent, handleSuccessfulPayment } from '../services/stripe.service.js';
import { handlePrintfulWebhook as processPrintfulWebhook } from '../services/printful.service.js';

/**
 * Handle Clerk webhooks
 * POST /api/webhooks/clerk
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const handleClerkWebhook = catchAsync(async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const payload = req.body;
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };

    const evt: any = verifyClerkWebhook(payload, headers);

    // Handle different event types
    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await syncUserToDatabase(evt.data);
        console.log(`✓ User ${evt.type === 'user.created' ? 'created' : 'updated'}:`, evt.data.id);
        break;

      default:
        console.log('Unhandled Clerk webhook event:', evt.type);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Clerk webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }
});

/**
 * Handle Stripe webhooks
 * POST /api/webhooks/stripe
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Missing Stripe signature',
      });
      return;
    }

    // Get raw body
    const payload = req.body;

    // Construct and verify webhook event
    const event = constructWebhookEvent(payload, signature);

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleSuccessfulPayment(session.id);
        console.log(`✓ Checkout session completed: ${session.id}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`✓ Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`✗ Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
});

/**
 * Handle Printful webhooks
 * POST /api/webhooks/printful
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const handlePrintfulWebhook = catchAsync(async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    console.log('Received Printful webhook:', webhookData.type);

    // Process webhook
    await processPrintfulWebhook(webhookData);

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('❌ Printful webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
});

/**
 * @module controllers/webhook
 * @description Webhook controllers for external services
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { verifyClerkWebhook, syncUserToDatabase } from '../services/clerk.service.js';
import { constructWebhookEvent, handleSuccessfulPayment, handleGiftCodePurchase } from '../services/stripe.service.js';
import { handlePrintfulWebhook as processPrintfulWebhook } from '../services/printful.service.js';
import crypto from 'crypto';

/**
 * @route POST /api/webhooks/clerk
 * @description Handles Clerk webhook events (user.created, user.updated)
 * @access Public (webhook signature verified)
 *
 * @param {Request} req - Express request (raw body with Svix headers)
 * @param {Response} res - Express response
 *
 * @returns {Object} Success message
 * @throws {400} Webhook verification failed
 */
export const handleClerkWebhook = catchAsync(async (req: Request, res: Response) => {
  try {
    // Get raw body as string (express.raw gives us a Buffer)
    const payload = req.body.toString('utf8');
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    const evt: any = verifyClerkWebhook(payload, headers);

    // Handle different event types
    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await syncUserToDatabase(evt.data);
        console.log(`�o" User ${evt.type === 'user.created' ? 'created' : 'updated'}:`, evt.data.id);
        break;

      default:
        console.log('Unhandled Clerk webhook event:', evt.type);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('�?O Clerk webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }
});

/**
 * @route POST /api/webhooks/stripe
 * @description Handles Stripe webhook events (checkout.session.completed, payment intents)
 * @access Public (webhook signature verified)
 *
 * @param {Request} req - Express request (raw body with Stripe signature)
 * @param {Response} res - Express response
 *
 * @returns {Object} Success message
 * @throws {400} Missing Stripe signature
 * @throws {400} Webhook processing failed
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
        if (session.metadata && session.metadata.giftCodeType) {
          await handleGiftCodePurchase(session);
          console.log(`�o" Gift code purchase completed: ${session.id}`);
        } else {
          await handleSuccessfulPayment(session.id);
          console.log(`�o" Checkout session completed: ${session.id}`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`�o" Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`�?O Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('�?O Stripe webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
});

/**
 * @route POST /api/webhooks/printful
 * @description Handles Printful webhook events for order fulfillment updates
 * @access Public (webhook signature verified if secret configured)
 *
 * @param {Request} req - Express request (raw body with optional X-Printful-Signature)
 * @param {Response} res - Express response
 *
 * @returns {Object} Success message
 * @throws {400} Invalid Printful webhook signature
 * @throws {400} Webhook processing failed
 */
export const handlePrintfulWebhook = catchAsync(async (req: Request, res: Response) => {
  try {
    // Optional shared-secret verification to protect webhook endpoint
    const sharedSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
    if (sharedSecret) {
      const signature = req.headers['x-printful-signature'];
      const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);
      const computed = crypto.createHmac('sha256', sharedSecret).update(payload).digest('hex');
      if (typeof signature !== 'string' || signature !== computed) {
        throw new Error('Invalid Printful webhook signature');
      }
    }

    const webhookData = req.body;

    console.log('Received Printful webhook:', webhookData.type);

    // Process webhook
    await processPrintfulWebhook(webhookData);

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('�?O Printful webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
});

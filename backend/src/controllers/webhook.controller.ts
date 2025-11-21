/**
 * @module controllers/webhook
 * @description Webhook controllers for external services
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { verifyClerkWebhook, syncUserToDatabase } from '../services/clerk.service.js';

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

/**
 * @module routes/webhook
 * @description Webhook routes for external services
 * @since 2025-11-21
 */

import { Router } from 'express';
import { handleClerkWebhook, handleStripeWebhook } from '../controllers/webhook.controller.js';
import express from 'express';

const router = Router();

/**
 * POST /api/webhooks/clerk
 * Handle Clerk user events
 * Note: Uses raw body parser for signature verification
 */
router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

/**
 * POST /api/webhooks/stripe
 * Handle Stripe payment events
 * Note: Uses raw body parser for signature verification
 */
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;

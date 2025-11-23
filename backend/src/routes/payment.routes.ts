/**
 * @module routes/payment
 * @description Payment routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { createCheckout, confirmSession } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/payments/create-checkout-session
 * Create Stripe checkout session (requires authentication)
 */
router.post('/create-checkout-session', requireAuth, createCheckout);

/**
 * POST /api/payments/confirm-session
 * Manually confirm a Stripe session (requires authentication)
 */
router.post('/confirm-session', requireAuth, confirmSession);

export default router;

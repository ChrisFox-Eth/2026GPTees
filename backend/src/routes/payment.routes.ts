/**
 * @module routes/payment
 * @description Payment routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { createCheckout } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/payments/create-checkout-session
 * Create Stripe checkout session (requires authentication)
 */
router.post('/create-checkout-session', requireAuth, createCheckout);

export default router;

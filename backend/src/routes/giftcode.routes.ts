/**
 * @module routes/giftcode
 * @description Gift code purchase routes
 */

import { Router } from 'express';
import { purchaseGiftCode } from '../controllers/giftcode.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/gift-codes/purchase
 * Create a Stripe checkout session for buying a gift code.
 */
router.post('/purchase', requireAuth, purchaseGiftCode);

export default router;

/**
 * @module routes/giftcode
 * @description Gift code purchase and checkout routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { purchaseGiftCode } from '../controllers/giftcode.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/gift-codes/purchase
 * @description Create a Stripe checkout session for purchasing a gift code
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {number} req.body.amount - Gift code amount in dollars
 * @param {string} [req.body.recipientEmail] - Optional recipient email address
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Stripe checkout session with URL and session ID
 * @throws {400} Bad Request - When amount is missing or invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.post('/purchase', requireAuth, purchaseGiftCode);

export default router;

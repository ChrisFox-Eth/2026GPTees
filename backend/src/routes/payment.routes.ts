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
 * @route POST /api/payments/create-checkout-session
 * @description Create a Stripe checkout session for order payment
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.orderId - Order ID to create checkout session for
 * @param {string} [req.body.promoCode] - Optional promo code to apply
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Stripe checkout session with URL and session ID
 * @throws {400} Bad Request - When order ID is missing or invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {404} Not Found - When order doesn't exist
 * @throws {500} Internal Server Error
 */
router.post('/create-checkout-session', requireAuth, createCheckout);

/**
 * @route POST /api/payments/confirm-session
 * @description Manually confirm a Stripe payment session
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.sessionId - Stripe session ID to confirm
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Confirmation result with order status
 * @throws {400} Bad Request - When session ID is missing or invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.post('/confirm-session', requireAuth, confirmSession);

export default router;

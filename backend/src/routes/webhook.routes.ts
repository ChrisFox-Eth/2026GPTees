/**
 * @module routes/webhook
 * @description Webhook routes for external services
 * @since 2025-11-21
 */

import { Router } from 'express';
import { handleClerkWebhook, handleStripeWebhook, handlePrintfulWebhook } from '../controllers/webhook.controller.js';
import express from 'express';

const router = Router();

/**
 * @route POST /api/webhooks/clerk
 * @description Handle Clerk authentication service webhooks for user lifecycle events
 * @access Public - verified via webhook signature
 *
 * @param {Request} req - Express request with raw body
 * @param {Buffer} req.body - Raw webhook payload for signature verification
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers['svix-id'] - Webhook ID
 * @param {string} req.headers['svix-timestamp'] - Webhook timestamp
 * @param {string} req.headers['svix-signature'] - Webhook signature
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Webhook processed successfully
 * @throws {400} Bad Request - When webhook signature verification fails
 * @throws {500} Internal Server Error
 *
 * @note Uses raw body parser for signature verification
 */
router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

/**
 * @route POST /api/webhooks/stripe
 * @description Handle Stripe payment service webhooks for payment events
 * @access Public - verified via webhook signature
 *
 * @param {Request} req - Express request with raw body
 * @param {Buffer} req.body - Raw webhook payload for signature verification
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers['stripe-signature'] - Stripe webhook signature
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Webhook processed successfully
 * @throws {400} Bad Request - When webhook signature verification fails or event type unknown
 * @throws {500} Internal Server Error
 *
 * @note Uses raw body parser for signature verification
 */
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

/**
 * @route POST /api/webhooks/printful
 * @description Handle Printful fulfillment service webhooks for order status updates
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Webhook payload
 * @param {string} req.body.type - Event type (order_updated, order_shipped, etc.)
 * @param {Object} req.body.data - Event data
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Webhook processed successfully
 * @throws {400} Bad Request - When payload is invalid
 * @throws {500} Internal Server Error
 *
 * @note Printful doesn't require signature verification by default
 */
router.post('/printful', express.json({ type: 'application/json' }), handlePrintfulWebhook);

export default router;

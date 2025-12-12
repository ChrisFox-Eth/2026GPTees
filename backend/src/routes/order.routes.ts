/**
 * @module routes/order
 * @description Order management routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import {
  getUserOrders,
  getOrderById,
  submitFulfillment,
  getOrderTracking,
  createPreviewOrder,
  createGuestPreviewOrder,
  claimPreviewOrder,
  updatePreviewItemVariant,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/orders
 * @description Get all orders for the current authenticated user
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of user's orders with full details
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.get('/', requireAuth, getUserOrders);

/**
 * @route POST /api/orders/preview
 * @description Create or reuse a preview order in PENDING_PAYMENT status
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.designId - Design ID to associate with preview order
 * @param {string} req.body.productId - Product ID for the order
 * @param {string} req.body.variantId - Product variant ID (size/color)
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Preview order object
 * @throws {400} Bad Request - When required fields are missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.post('/preview', requireAuth, createPreviewOrder);

/**
 * @route POST /api/orders/preview/guest
 * @description Create a preview order for unauthenticated users
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.designId - Design ID to associate with preview order
 * @param {string} req.body.productId - Product ID for the order
 * @param {string} req.body.variantId - Product variant ID (size/color)
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Guest preview order object with claim token
 * @throws {400} Bad Request - When required fields are missing
 * @throws {500} Internal Server Error
 */
router.post('/preview/guest', createGuestPreviewOrder);

/**
 * @route POST /api/orders/preview/claim
 * @description Claim a guest preview order after user authentication
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.orderId - Guest order ID to claim
 * @param {string} req.body.claimToken - Token for claiming guest order
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Claimed order object now associated with user
 * @throws {400} Bad Request - When order ID or claim token is missing/invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {404} Not Found - When order doesn't exist
 * @throws {500} Internal Server Error
 */
router.post('/preview/claim', requireAuth, claimPreviewOrder);

/**
 * @route PATCH /api/orders/:id/item
 * @description Update product variant (size/color) for a preview order item
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Order ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.variantId - New variant ID to update to
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Updated order object
 * @throws {400} Bad Request - When variant ID is missing or invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When order doesn't belong to user
 * @throws {404} Not Found - When order doesn't exist
 * @throws {500} Internal Server Error
 */
router.patch('/:id/item', requireAuth, updatePreviewItemVariant);

/**
 * @route GET /api/orders/:id
 * @description Get detailed information for a specific order
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Order ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Order object with full details
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When order doesn't belong to user
 * @throws {404} Not Found - When order doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/:id', requireAuth, getOrderById);

/**
 * @route POST /api/orders/:id/submit-fulfillment
 * @description Submit an approved design to Printful for fulfillment
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Order ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Printful order submission result
 * @throws {400} Bad Request - When design is not approved or order invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When order doesn't belong to user
 * @throws {404} Not Found - When order doesn't exist
 * @throws {500} Internal Server Error
 */
router.post('/:id/submit-fulfillment', requireAuth, submitFulfillment);

/**
 * @route GET /api/orders/:id/tracking
 * @description Retrieve tracking and fulfillment status for an order
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Order ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Tracking information including carrier, tracking number, and status
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When order doesn't belong to user
 * @throws {404} Not Found - When order doesn't exist or no tracking available
 * @throws {500} Internal Server Error
 */
router.get('/:id/tracking', requireAuth, getOrderTracking);

export default router;

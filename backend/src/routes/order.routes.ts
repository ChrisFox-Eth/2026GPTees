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
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/orders
 * Get all orders for current user (requires authentication)
 */
router.get('/', requireAuth, getUserOrders);

/**
 * POST /api/orders/preview
 * Create or reuse a preview order in PENDING_PAYMENT (requires authentication)
 */
router.post('/preview', requireAuth, createPreviewOrder);

/**
 * POST /api/orders/preview/guest
 * Create a preview order for unauthenticated users (no authentication)
 */
router.post('/preview/guest', createGuestPreviewOrder);

/**
 * POST /api/orders/preview/claim
 * Claim a guest preview order after login
 */
router.post('/preview/claim', requireAuth, claimPreviewOrder);

/**
 * GET /api/orders/:id
 * Get order by ID (requires authentication)
 */
router.get('/:id', requireAuth, getOrderById);

/**
 * POST /api/orders/:id/submit-fulfillment
 * Submit an approved design to Printful
 */
router.post('/:id/submit-fulfillment', requireAuth, submitFulfillment);

/**
 * GET /api/orders/:id/tracking
 * Retrieve tracking/fulfillment status
 */
router.get('/:id/tracking', requireAuth, getOrderTracking);

export default router;

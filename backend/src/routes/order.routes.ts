/**
 * @module routes/order
 * @description Order management routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { getUserOrders, getOrderById } from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/orders
 * Get all orders for current user (requires authentication)
 */
router.get('/', requireAuth, getUserOrders);

/**
 * GET /api/orders/:id
 * Get order by ID (requires authentication)
 */
router.get('/:id', requireAuth, getOrderById);

export default router;

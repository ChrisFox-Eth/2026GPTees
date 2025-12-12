/**
 * @module routes/promocode
 * @description Promo code and gift code validation routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { validatePromoCode } from '../controllers/promocode.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/promo/validate
 * @description Validate a promo code or gift code and return its details
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.code - Promo or gift code to validate
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Code validation result with discount amount, type, and validity
 * @throws {400} Bad Request - When code parameter is missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {404} Not Found - When code doesn't exist or is expired
 * @throws {500} Internal Server Error
 */
router.get('/validate', requireAuth, validatePromoCode);

export default router;

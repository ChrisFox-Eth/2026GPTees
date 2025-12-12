/**
 * @module routes/admin
 * @description Administrative routes for system management and promo codes
 * @since 2025-11-21
 */

import express from 'express';
import {
  syncFulfillmentStatuses,
  createPromoCode,
  listPromoCodes,
  getPromoCodeDetail,
  getPromoCodesMetrics,
  getPromoCodeMetricsById,
  disablePromoCode,
  enablePromoCode,
  getPrintfulVariants,
  listEmailTemplates,
  previewEmailTemplate,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

/**
 * @route POST /api/admin/sync-fulfillment
 * @description Sync fulfillment statuses from Printful to local database
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Sync result with updated order count
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.post('/sync-fulfillment', requireAuth, requireAdmin, syncFulfillmentStatuses);

/**
 * @route POST /api/admin/promo-codes
 * @description Create a new promo code
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.code - Promo code string
 * @param {string} req.body.type - Code type (PERCENTAGE or FIXED)
 * @param {number} req.body.value - Discount value
 * @param {Date} [req.body.expiresAt] - Optional expiration date
 * @param {number} [req.body.maxUses] - Optional maximum usage limit
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Created promo code object
 * @throws {400} Bad Request - When required fields are missing or invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {409} Conflict - When promo code already exists
 * @throws {500} Internal Server Error
 */
router.post('/promo-codes', requireAuth, requireAdmin, createPromoCode);

/**
 * @route GET /api/admin/promo-codes
 * @description Get list of all promo codes
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.limit] - Maximum number of codes to return
 * @param {number} [req.query.offset] - Pagination offset
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of promo code objects
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.get('/promo-codes', requireAuth, requireAdmin, listPromoCodes);

/**
 * @route GET /api/admin/promo-codes/metrics
 * @description Get aggregated metrics for all promo codes
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Metrics including total codes, active codes, total redemptions
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.get('/promo-codes/metrics', requireAuth, requireAdmin, getPromoCodesMetrics);

/**
 * @route GET /api/admin/promo-codes/:id/metrics
 * @description Get detailed metrics for a specific promo code
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Promo code ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Detailed metrics including usage count, revenue impact
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {404} Not Found - When promo code doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/promo-codes/:id/metrics', requireAuth, requireAdmin, getPromoCodeMetricsById);

/**
 * @route GET /api/admin/promo-codes/:id
 * @description Get detailed information for a specific promo code
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Promo code ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Promo code object with full details
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {404} Not Found - When promo code doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/promo-codes/:id', requireAuth, requireAdmin, getPromoCodeDetail);

/**
 * @route PATCH /api/admin/promo-codes/:id/disable
 * @description Disable a promo code
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Promo code ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Updated promo code object with disabled status
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {404} Not Found - When promo code doesn't exist
 * @throws {500} Internal Server Error
 */
router.patch('/promo-codes/:id/disable', requireAuth, requireAdmin, disablePromoCode);

/**
 * @route PATCH /api/admin/promo-codes/:id/enable
 * @description Enable a previously disabled promo code
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Promo code ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Updated promo code object with enabled status
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {404} Not Found - When promo code doesn't exist
 * @throws {500} Internal Server Error
 */
router.patch('/promo-codes/:id/enable', requireAuth, requireAdmin, enablePromoCode);

/**
 * @route GET /api/admin/printful/variants
 * @description Lookup Printful variant information for products
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.productId - Printful product ID
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of available variants with IDs, sizes, and colors
 * @throws {400} Bad Request - When product ID is missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.get('/printful/variants', requireAuth, requireAdmin, getPrintfulVariants);

/**
 * @route GET /api/admin/email-templates
 * @description Get list of all available email templates
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of template objects with name and description
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.get('/email-templates', requireAuth, requireAdmin, listEmailTemplates);

/**
 * @route GET /api/admin/email-templates/:name/preview
 * @description Preview an email template with sample data
 * @access Admin - requires admin role
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.name - Template name (orderConfirmed, designApproved, orderShipped, abandonedCheckout, studioTips, giftCode)
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Template preview with subject, HTML, and config
 * @throws {400} Bad Request - When template name is invalid
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When user is not an admin
 * @throws {500} Internal Server Error
 */
router.get('/email-templates/:name/preview', requireAuth, requireAdmin, previewEmailTemplate);

export default router;

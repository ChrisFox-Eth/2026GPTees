/**
 * @module routes/design
 * @description Design generation routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import {
  createDesign,
  getDesign,
  getDesignsByOrder,
  approveDesign,
  getRandomPrompt,
  getDesignGallery,
  cloneDesign,
  createDesignGuest,
} from '../controllers/design.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/designs/random-prompt
 * @description Get a random creative prompt for AI design generation
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Random prompt object with text and category
 * @throws {500} Internal Server Error
 */
router.get('/random-prompt', getRandomPrompt);

/**
 * @route POST /api/designs/generate
 * @description Generate a new AI design based on user prompt
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.prompt - Text prompt for AI design generation
 * @param {string} req.body.orderId - Order ID to associate design with
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Generated design object with image URL and metadata
 * @throws {400} Bad Request - When prompt or order ID is missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.post('/generate', requireAuth, createDesign);

/**
 * @route POST /api/designs/generate/guest
 * @description Generate a new AI design for unauthenticated users
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.prompt - Text prompt for AI design generation
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Generated design object with image URL and guest token
 * @throws {400} Bad Request - When prompt is missing
 * @throws {500} Internal Server Error
 */
router.post('/generate/guest', createDesignGuest);

/**
 * @route GET /api/designs/gallery
 * @description Get public gallery feed of recent approved designs
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.limit] - Maximum number of designs to return
 * @param {number} [req.query.offset] - Pagination offset
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of design objects for gallery display
 * @throws {500} Internal Server Error
 */
router.get('/gallery', getDesignGallery);

/**
 * @route POST /api/designs/clone
 * @description Clone an existing design from the gallery
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.designId - Design ID to clone
 * @param {string} req.body.orderId - Order ID to associate cloned design with
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Cloned design object
 * @throws {400} Bad Request - When design ID or order ID is missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {404} Not Found - When design doesn't exist
 * @throws {500} Internal Server Error
 */
router.post('/clone', requireAuth, cloneDesign);

/**
 * @route GET /api/designs
 * @description Get all designs associated with a specific order
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.orderId - Order ID to get designs for
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of design objects for the order
 * @throws {400} Bad Request - When order ID is missing
 * @throws {401} Unauthorized - When not authenticated
 * @throws {500} Internal Server Error
 */
router.get('/', requireAuth, getDesignsByOrder);

/**
 * @route GET /api/designs/:id
 * @description Get detailed information for a specific design
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Design ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Design object with full details
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When design doesn't belong to user
 * @throws {404} Not Found - When design doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/:id', requireAuth, getDesign);

/**
 * @route POST /api/designs/:id/approve
 * @description Approve a design for production and fulfillment
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Design ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Approved design object with updated status
 * @throws {400} Bad Request - When design is already approved or invalid state
 * @throws {401} Unauthorized - When not authenticated
 * @throws {403} Forbidden - When design doesn't belong to user
 * @throws {404} Not Found - When design doesn't exist
 * @throws {500} Internal Server Error
 */
router.post('/:id/approve', requireAuth, approveDesign);

export default router;

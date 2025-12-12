/**
 * @module routes/auth
 * @description Authentication routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import { getCurrentUser } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/auth/me
 * @description Get current authenticated user information
 * @access Protected - requires authentication
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - User information including ID, email, and profile data
 * @throws {401} Unauthorized - When authentication token is missing or invalid
 * @throws {500} Internal Server Error
 */
router.get('/me', requireAuth, getCurrentUser);

export default router;

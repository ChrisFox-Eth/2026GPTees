/**
 * @module routes/health
 * @description Health check routes for the API
 * Provides endpoints to verify the server is running and responsive
 *
 * @since 2025-10-20
 * @author Template
 *
 * @route GET /api/health - Returns server health status
 * @route GET /api/health/detailed - Returns detailed health information
 */

import { Router } from 'express';
import * as healthController from '../controllers/health.controller';

const router = Router();

/**
 * GET /api/health
 * Returns basic server health status
 *
 * @returns {Object} Health status object with success flag and message
 * @example
 * // Response
 * {
 *   success: true,
 *   message: "Server is healthy",
 *   timestamp: "2025-10-20T12:00:00Z"
 * }
 */
router.get('/', healthController.checkHealth);

/**
 * GET /api/health/detailed
 * Returns detailed server and environment information
 *
 * @returns {Object} Detailed health information including uptime, memory usage, etc.
 */
router.get('/detailed', healthController.getDetailedHealth);

export default router;

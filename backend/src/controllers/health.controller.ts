/**
 * @module controllers/health
 * @description Health check controller for monitoring server status
 * Provides functions to check basic and detailed server health
 *
 * @since 2025-10-20
 * @author Template
 */

import { Request, Response } from 'express';

/**
 * Check basic server health
 * Responds with a simple status message indicating the server is operational
 *
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request: GET /api/health
 * // Response: 200 OK
 * {
 *   success: true,
 *   message: "Server is healthy",
 *   timestamp: "2025-10-20T12:00:00Z"
 * }
 *
 * @status Active
 * @category Health Check
 */
export const checkHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get detailed server health information
 * Returns comprehensive information about server status, uptime, and resource usage
 *
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {void}
 *
 * @example
 * // Request: GET /api/health/detailed
 * // Response: 200 OK
 * {
 *   success: true,
 *   uptime: 3600,
 *   timestamp: "2025-10-20T12:00:00Z",
 *   memory: {
 *     rss: 123456,
 *     heapTotal: 654321,
 *     heapUsed: 456789
 *   },
 *   environment: "development"
 * }
 *
 * @status Active
 * @category Health Check
 */
export const getDetailedHealth = (_req: Request, res: Response): void => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.status(200).json({
    success: true,
    message: 'Detailed server health check',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
  });
};

/**
 * Export health controller functions
 *
 * @status Active
 * @category Health Check
 *
 * @example
 * // Request: GET /api/health
 * // Response: 200 OK
 * {
 *   success: true,
 *   message: "Server is healthy",
 *   timestamp: "2025-10-20T12:00:00Z"
 * }
 */
export const healthController = { checkHealth, getDetailedHealth };



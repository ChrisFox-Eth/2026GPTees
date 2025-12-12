/**
 * @module middleware/admin
 * @description Admin authorization guard using allowlist + feature flag
 * @since 2025-11-21
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

/**
 * @middleware requireAdmin
 * @description Verifies user has admin privileges before accessing protected endpoints
 * Checks ADMIN_EMAIL_ALLOWLIST environment variable and development mode settings
 *
 * @param {Request} req - Express request (must have req.user attached by auth middleware)
 * @param {Response} _res - Express response (unused)
 * @param {NextFunction} next - Express next function
 *
 * @throws {403} Admin endpoints disabled in production
 * @throws {401} Authentication required when user not present
 * @throws {403} Admin access denied when user not in allowlist
 *
 * @returns {void}
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  // Hard-disable admin APIs outside local development.
  if (process.env.NODE_ENV !== 'development') {
    return next(new AppError('Admin endpoints are disabled in production.', 403));
  }

  // Local/dev bypass if SKIP_AUTH is enabled
  if ((process.env.SKIP_AUTH || '').toLowerCase() === 'true') {
    return next();
  }

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = (req.user.email || '').toLowerCase();
  const isAllowed = allowlist.length === 0 || allowlist.includes(email);

  if (isAllowed) {
    return next();
  }

  return next(new AppError('Admin access denied', 403));
};

export default requireAdmin;

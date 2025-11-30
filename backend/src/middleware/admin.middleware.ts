/**
 * @module middleware/admin
 * @description Admin authorization guard using allowlist + feature flag
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware.js';

/**
 * Check if the current user is allowed to access admin endpoints.
 * Uses ADMIN_EMAIL_ALLOWLIST (comma-separated, case-insensitive) or ALLOW_ADMIN_SYNC=true (dev backdoor).
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  // Local/dev bypass if SKIP_AUTH is enabled
  if ((process.env.SKIP_AUTH || '').toLowerCase() === 'true') {
    return next();
  }

  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const allowFlag = (process.env.ALLOW_ADMIN_SYNC || '').trim().toLowerCase() === 'true';
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isDev = process.env.NODE_ENV === 'development';
  const email = (req.user.email || '').toLowerCase();
  const isAllowed = allowlist.includes(email);

  if (isAllowed || allowFlag || isDev) {
    return next();
  }

  return next(new AppError('Admin access denied', 403));
};

export default requireAdmin;

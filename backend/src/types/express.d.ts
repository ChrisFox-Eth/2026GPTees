/**
 * @module types/express
 * @description Extended Express types for 2026GPTees
 * @since 2025-11-21
 */

import { Request } from 'express';

/**
 * @interface Request
 * @description Extended Express Request interface with user authentication data
 * @property {Object} user - Authenticated user information (attached by auth middleware)
 * @property {string} user.id - Database user ID
 * @property {string} user.clerkId - Clerk user ID
 * @property {string} user.email - User email address
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
      };
    }
  }
}

export {};

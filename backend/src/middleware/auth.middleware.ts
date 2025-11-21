/**
 * @module middleware/auth
 * @description Authentication middleware using Clerk
 * @since 2025-11-21
 */

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { AppError } from './error.middleware.js';
import { getUserByClerkId } from '../services/clerk.service.js';

/**
 * Require authentication middleware
 * Verifies Clerk session token and attaches user to request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401);
    }

    const sessionToken = authHeader.split(' ')[1];

    if (!sessionToken) {
      throw new AppError('Invalid authorization token', 401);
    }

    // Verify session with Clerk
    const session = await clerkClient.sessions.verifySession(
      sessionToken,
      sessionToken
    );

    if (!session || !session.userId) {
      throw new AppError('Invalid or expired session', 401);
    }

    // Get user from database
    const user = await getUserByClerkId(session.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
    };

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Auth middleware error:', error);
      next(new AppError('Authentication failed', 401));
    }
  }
};

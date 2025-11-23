/**
 * @module middleware/auth
 * @description Authentication middleware using Clerk
 * @since 2025-11-21
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid authorization token', 401);
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new AppError('Clerk secret key missing', 500);
    }

    const payload = await verifyToken(token, {
      secretKey,
      issuer: (iss) => iss.startsWith('https://clerk.'),
      // Ensure the token is actually meant for this app
      audience: process.env.CLERK_PUBLISHABLE_KEY,
    });

    if (!payload || !payload.sub) {
      throw new AppError('Invalid or expired token', 401);
    }

    const clerkUserId = payload.sub;

    const user = await getUserByClerkId(clerkUserId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

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

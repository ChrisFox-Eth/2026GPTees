/**
 * @module middleware/auth
 * @description Authentication middleware using Clerk
 * @since 2025-11-21
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { AppError } from './error.middleware.js';
import { getUserByClerkId, getClerkUser, syncUserToDatabase } from '../services/clerk.service.js';
import prisma from '../config/database.js';

/**
 * @middleware requireAuth
 * @description Verifies Clerk JWT session token and attaches user info to request
 * Supports development bypass with SKIP_AUTH environment variable
 * Auto-provisions users in database if missing
 *
 * @param {Request} req - Express request (mutated to add req.user)
 * @param {Response} _res - Express response (unused)
 * @param {NextFunction} next - Express next function
 *
 * @throws {401} No authorization token provided
 * @throws {401} Invalid authorization token
 * @throws {500} Clerk secret key missing
 * @throws {401} Invalid or expired token
 * @throws {401} Authentication failed (generic error)
 *
 * @returns {Promise<void>}
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // Local/dev bypass: set SKIP_AUTH=true and optionally SKIP_AUTH_EMAIL
  if ((process.env.SKIP_AUTH || '').toLowerCase() === 'true') {
    const id = process.env.SKIP_AUTH_USER_ID || 'dev-user-id';
    const clerkId = process.env.SKIP_AUTH_CLERK_ID || 'dev-clerk-id';
    const email = process.env.SKIP_AUTH_EMAIL || 'dev@example.com';

    await prisma.user.upsert({
      where: { id },
      update: { clerkId, email },
      create: { id, clerkId, email },
    });

    req.user = { id, clerkId, email };
    return next();
  }
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

    let user = await getUserByClerkId(clerkUserId);

    if (!user) {
      // Auto-provision user if missing in our DB
      const clerkUser = await getClerkUser(clerkUserId);
      const fallbackEmail =
        (payload as any)?.email ||
        (payload as any)?.email_address ||
        (payload as any)?.email_addresses?.[0];
      user = await syncUserToDatabase(clerkUser, fallbackEmail);
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

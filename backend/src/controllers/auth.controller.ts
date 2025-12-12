/**
 * @module controllers/auth
 * @description Authentication controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { getUserByClerkId } from '../services/clerk.service.js';

/**
 * @route GET /api/auth/me
 * @description Retrieves authenticated user's profile information
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (requires req.user)
 * @param {Response} res - Express response
 *
 * @returns {Object} User profile data (id, email, firstName, lastName, createdAt)
 * @throws {401} Not authenticated
 */
export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
    return;
  }

  const user = await getUserByClerkId(req.user.clerkId);

  res.json({
    success: true,
    data: {
      id: user?.id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      createdAt: user?.createdAt,
    },
  });
});

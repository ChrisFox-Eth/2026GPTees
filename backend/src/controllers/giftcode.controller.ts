/**
 * @module controllers/giftcode
 * @description Gift code purchase endpoints
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { TierType } from '../config/pricing.js';
import { createGiftCodeSession } from '../services/stripe.service.js';

/**
 * @route POST /api/gift-codes/purchase
 * @description Creates Stripe checkout session for purchasing gift codes
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (body: tier, usageLimit)
 * @param {Response} res - Express response
 *
 * @returns {Object} Stripe session details (sessionId, url)
 * @throws {401} Authentication required
 * @throws {400} Invalid tier (must be LIMITLESS)
 * @throws {400} Invalid percentOff for PERCENT_OFF codes
 */
export const purchaseGiftCode = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { tier, usageLimit } = req.body;
  const normalizedTier = typeof tier === 'string' ? tier.trim().toUpperCase() : '';

  if (!normalizedTier || !Object.values(TierType).includes(normalizedTier as TierType)) {
    throw new AppError('tier must be LIMITLESS', 400);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const session = await createGiftCodeSession({
    userId: req.user.id,
    tier: normalizedTier as TierType,
    usageLimit: usageLimit ? Number(usageLimit) : 1,
    successUrl: `${frontendUrl}/gift/success`,
    cancelUrl: `${frontendUrl}/gift`,
  });

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      url: session.url,
    },
  });
});

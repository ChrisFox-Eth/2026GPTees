/**
 * @module controllers/giftcode
 * @description Gift code purchase controller
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { TierType } from '../config/pricing.js';
import { createGiftCodeSession } from '../services/stripe.service.js';

/**
 * Create Stripe checkout session for purchasing a gift code.
 * POST /api/gift-codes/purchase
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

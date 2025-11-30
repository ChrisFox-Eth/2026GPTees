/**
 * @module controllers/promocode
 * @description Promo/gift code utilities (validation)
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';

/**
 * Validate a promo/gift code (usage/count/type).
 * GET /api/promo/validate?code=ABC
 */
export const validatePromoCode = catchAsync(async (req: Request, res: Response) => {
  const code = (req.query.code as string | undefined)?.trim();

  if (!code) {
    throw new AppError('Promo code is required', 400);
  }

  const promo = await prisma.promoCode.findFirst({
    where: { code, disabled: false },
    select: {
      id: true,
      code: true,
      type: true,
      productTier: true,
      percentOff: true,
      usageLimit: true,
      usageCount: true,
      disabled: true,
    },
  });

  if (!promo) {
    throw new AppError('Invalid or unknown promo code.', 400);
  }

  if (promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) {
    throw new AppError('This promo code has already been redeemed the maximum number of times.', 400);
  }

  res.json({
    success: true,
    data: promo,
  });
});

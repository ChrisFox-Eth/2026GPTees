/**
 * @module controllers/payment
 * @description Payment controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { createCheckoutSession } from '../services/stripe.service.js';

/**
 * Create Stripe checkout session
 * POST /api/payments/create-checkout-session
 */
export const createCheckout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Cart items are required',
    });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const checkoutData = {
    userId: req.user.id,
    items,
    successUrl: `${frontendUrl}/checkout/success`,
    cancelUrl: `${frontendUrl}/cart`,
  };

  const session = await createCheckoutSession(checkoutData);

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      url: session.url,
    },
  });
});

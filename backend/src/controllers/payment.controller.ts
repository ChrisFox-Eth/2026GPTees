/**
 * @module controllers/payment
 * @description Payment controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { createCheckoutSession, confirmCheckoutSession } from '../services/stripe.service.js';

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

  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Cart items are required',
    });
    return;
  }

  if (
    !shippingAddress ||
    !shippingAddress.name ||
    !shippingAddress.address1 ||
    !shippingAddress.city ||
    !shippingAddress.zip ||
    !shippingAddress.country
  ) {
    res.status(400).json({
      success: false,
      message: 'Shipping address is required',
    });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const checkoutData = {
    userId: req.user.id,
    items,
    shippingAddress,
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

/**
 * Manually confirm a Stripe checkout session (fallback when webhook is missing)
 * POST /api/payments/confirm-session
 */
export const confirmSession = catchAsync(async (req: Request, res: Response) => {
  const { orderId, sessionId } = req.body;

  if (!orderId || !sessionId) {
    res.status(400).json({ success: false, message: 'orderId and sessionId are required' });
    return;
  }

  await confirmCheckoutSession(sessionId, orderId);

  res.json({ success: true, message: 'Session confirmed, order marked as paid' });
});

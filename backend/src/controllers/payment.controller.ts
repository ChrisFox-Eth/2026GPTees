/**
 * @module controllers/payment
 * @description Payment controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import { createCheckoutSession, confirmCheckoutSession } from '../services/stripe.service.js';

/**
 * @route POST /api/payments/create-checkout-session
 * @description Creates Stripe checkout session for order payment
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (body: items, shippingAddress, code, orderId)
 * @param {Response} res - Express response
 *
 * @returns {Object} Stripe session details (sessionId, url, orderId, freeOrder)
 * @throws {401} Authentication required
 * @throws {400} Shipping address is required
 * @throws {400} Cart items are required (when no orderId)
 */
export const createCheckout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { items, shippingAddress, code, orderId } = req.body;

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

  if (!orderId && (!items || !Array.isArray(items) || items.length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Cart items are required',
    });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const derivedCancelUrl = orderId
    ? `${frontendUrl}/design?orderId=${orderId}`
    : `${frontendUrl}/`;

  const checkoutData = {
    userId: req.user.id,
    items,
    shippingAddress,
    successUrl: `${frontendUrl}/checkout/success`,
    cancelUrl: derivedCancelUrl,
    code: code ? String(code).trim() : undefined,
    orderId: orderId ? String(orderId) : undefined,
  };

  const session = await createCheckoutSession(checkoutData);

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      url: session.url,
      orderId: session.orderId,
      freeOrder: session.freeOrder || false,
    },
  });
});

/**
 * @route POST /api/payments/confirm-session
 * @description Manually confirms Stripe checkout session (fallback for missed webhooks)
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (body: orderId, sessionId)
 * @param {Response} res - Express response
 *
 * @returns {Object} Success message
 * @throws {400} orderId and sessionId are required
 * @throws {401} Authentication required
 */
export const confirmSession = catchAsync(async (req: Request, res: Response) => {
  const { orderId, sessionId } = req.body;

  if (!orderId || !sessionId) {
    res.status(400).json({ success: false, message: 'orderId and sessionId are required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  await confirmCheckoutSession(sessionId, orderId, req.user.id);

  res.json({ success: true, message: 'Session confirmed, order marked as paid' });
});

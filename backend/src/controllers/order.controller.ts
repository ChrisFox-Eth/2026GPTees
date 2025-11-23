/**
 * @module controllers/order
 * @description Order management controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';
import { createPrintfulOrder, getPrintfulOrderStatus } from '../services/printful.service.js';

/**
 * Get all orders for current user
 * GET /api/orders
 */
export const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      designs: true,
      payment: true,
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: orders,
  });
});

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          design: true,
        },
      },
      designs: true,
      payment: true,
      address: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  res.json({
    success: true,
    data: order,
  });
});

/**
 * Submit an approved design to Printful for fulfillment
 * POST /api/orders/:id/submit-fulfillment
 */
export const submitFulfillment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      designs: {
        where: { approvalStatus: true },
        orderBy: { approvedAt: 'desc' },
      },
      user: true,
      items: {
        include: { product: true },
      },
      address: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  if (!order.address) {
    throw new AppError('Order is missing a shipping address', 400);
  }

  if (!order.designs.length) {
    throw new AppError('No approved design found for this order', 400);
  }

  // Avoid duplicate submissions
  if (order.printfulOrderId) {
    res.json({
      success: true,
      message: 'Order already submitted to Printful',
      data: { printfulOrderId: order.printfulOrderId },
    });
    return;
  }

  const approvedDesign = order.designs[0];

  const result = await createPrintfulOrder(order.id, approvedDesign.id);

  if (!result.success) {
    // Persist the failure reason so the user can retry later
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: `ERROR: ${result.error}`,
        status: 'DESIGN_APPROVED',
      },
    });

    throw new AppError(result.error || 'Failed to submit order to Printful', 400);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      fulfillmentStatus: 'submitted',
    },
  });

  res.json({
    success: true,
    data: {
      printfulOrderId: result.printfulOrderId,
    },
    message: 'Order submitted for fulfillment',
  });
});

/**
 * Get fulfillment tracking/status for an order
 * GET /api/orders/:id/tracking
 */
export const getOrderTracking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  if (!order.printfulOrderId) {
    res.json({
      success: true,
      data: {
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        trackingNumber: order.trackingNumber,
      },
      message: 'Order not yet submitted to Printful',
    });
    return;
  }

  // Fetch latest status from Printful
  const status = await getPrintfulOrderStatus(order.printfulOrderId);

  const tracking = status?.shipments?.[0];
  const trackingNumber = tracking?.tracking_number || order.trackingNumber;
  const trackingUrl = tracking?.tracking_url;
  const fulfillmentStatus = status?.status || order.fulfillmentStatus;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      fulfillmentStatus,
      trackingNumber,
      shippedAt: fulfillmentStatus === 'shipped' ? new Date() : order.shippedAt,
    },
  });

  res.json({
    success: true,
    data: {
      status: order.status,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
    },
  });
});

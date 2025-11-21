/**
 * @module controllers/order
 * @description Order management controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';

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

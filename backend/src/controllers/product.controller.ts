/**
 * @module controllers/product
 * @description Product catalog controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';
import { TIERS } from '../config/pricing.js';

/**
 * Get all products
 * GET /api/products
 */
export const getProducts = catchAsync(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: products.map((p) => ({ ...p, tierPricing: TIERS })),
    count: products.length,
  });
});

/**
 * Get single product by ID
 * GET /api/products/:id
 */
export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  res.json({
    success: true,
    data: product ? { ...product, tierPricing: TIERS } : null,
  });
});

/**
 * Get single product by slug
 * GET /api/products/slug/:slug
 */
export const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
    });
    return;
  }

  res.json({
    success: true,
    data: product ? { ...product, tierPricing: TIERS } : null,
  });
});

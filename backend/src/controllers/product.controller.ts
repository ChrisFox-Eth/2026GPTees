/**
 * @module controllers/product
 * @description Product catalog controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';
import { getTierPricingMap } from '../services/pricing.service.js';

/**
 * @route GET /api/products
 * @description Retrieves all active products with tier pricing
 * @access Public
 *
 * @param {Request} _req - Express request (unused)
 * @param {Response} res - Express response
 *
 * @returns {Object} Array of products with tier pricing information
 */
export const getProducts = catchAsync(async (_req: Request, res: Response) => {
  const tierPricing = await getTierPricingMap();
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
    data: products.map((p: any) => ({ ...p, tierPricing })),
    count: products.length,
  });
});

/**
 * @route GET /api/products/:id
 * @description Retrieves a single product by ID with tier pricing
 * @access Public
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Product details with tier pricing
 * @throws {404} Product not found
 */
export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tierPricing = await getTierPricingMap();
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
    data: product ? { ...product, tierPricing } : null,
  });
});

/**
 * @route GET /api/products/slug/:slug
 * @description Retrieves a single product by slug with tier pricing
 * @access Public
 *
 * @param {Request} req - Express request (params.slug required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Product details with tier pricing
 * @throws {404} Product not found
 */
export const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const tierPricing = await getTierPricingMap();
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
    data: product ? { ...product, tierPricing } : null,
  });
});

/**
 * @module routes/product
 * @description Product catalog routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
} from '../controllers/product.controller.js';

const router = Router();

/**
 * GET /api/products
 * Get all products
 */
router.get('/', getProducts);

/**
 * GET /api/products/slug/:slug
 * Get product by slug
 */
router.get('/slug/:slug', getProductBySlug);

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', getProductById);

export default router;

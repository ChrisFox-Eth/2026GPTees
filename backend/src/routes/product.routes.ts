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
 * @route GET /api/products
 * @description Get all available products in the catalog
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {Array<Object>} 200 - Array of product objects with details
 * @throws {500} Internal Server Error
 */
router.get('/', getProducts);

/**
 * @route GET /api/products/slug/:slug
 * @description Get a specific product by its URL slug
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.slug - Product URL slug
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Product object with full details
 * @throws {404} Not Found - When product with specified slug doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/slug/:slug', getProductBySlug);

/**
 * @route GET /api/products/:id
 * @description Get a specific product by its ID
 * @access Public
 *
 * @param {Request} req - Express request
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Product ID
 * @param {Response} res - Express response
 *
 * @returns {Object} 200 - Product object with full details
 * @throws {404} Not Found - When product with specified ID doesn't exist
 * @throws {500} Internal Server Error
 */
router.get('/:id', getProductById);

export default router;

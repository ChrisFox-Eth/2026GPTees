/**
 * @module routes/design
 * @description Design generation routes
 * @since 2025-11-21
 */

import { Router } from 'express';
import {
  createDesign,
  getDesign,
  getDesignsByOrder,
  approveDesign,
  getRandomPrompt,
  getDesignGallery,
} from '../controllers/design.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/designs/random-prompt
 * Get random creative prompt
 */
router.get('/random-prompt', getRandomPrompt);

/**
 * POST /api/designs/generate
 * Generate new AI design (requires authentication)
 */
router.post('/generate', requireAuth, createDesign);

/**
 * GET /api/designs/gallery
 * Public gallery feed of recent designs
 */
router.get('/gallery', getDesignGallery);

/**
 * GET /api/designs
 * Get designs for an order (requires authentication)
 */
router.get('/', requireAuth, getDesignsByOrder);

/**
 * GET /api/designs/:id
 * Get design by ID (requires authentication)
 */
router.get('/:id', requireAuth, getDesign);

/**
 * POST /api/designs/:id/approve
 * Approve a design (requires authentication)
 */
router.post('/:id/approve', requireAuth, approveDesign);

export default router;

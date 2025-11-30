/**
 * @module routes/promocode
 * @description Promo/gift code validation routes
 */

import { Router } from 'express';
import { validatePromoCode } from '../controllers/promocode.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/promo/validate
 * Validate a promo/gift code and return metadata.
 */
router.get('/validate', requireAuth, validatePromoCode);

export default router;

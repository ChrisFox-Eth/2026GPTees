import express from 'express';
import {
  syncFulfillmentStatuses,
  createPromoCode,
  listPromoCodes,
  getPromoCodeDetail,
  getPromoCodesMetrics,
  getPromoCodeMetricsById,
  disablePromoCode,
  enablePromoCode,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

/**
 * Dev/admin utilities
 */
router.post('/sync-fulfillment', requireAuth, requireAdmin, syncFulfillmentStatuses);

/**
 * Promo code admin APIs
 */
router.post('/promo-codes', requireAuth, requireAdmin, createPromoCode);
router.get('/promo-codes', requireAuth, requireAdmin, listPromoCodes);
router.get('/promo-codes/metrics', requireAuth, requireAdmin, getPromoCodesMetrics);
router.get('/promo-codes/:id/metrics', requireAuth, requireAdmin, getPromoCodeMetricsById);
router.get('/promo-codes/:id', requireAuth, requireAdmin, getPromoCodeDetail);
router.patch('/promo-codes/:id/disable', requireAuth, requireAdmin, disablePromoCode);
router.patch('/promo-codes/:id/enable', requireAuth, requireAdmin, enablePromoCode);

export default router;

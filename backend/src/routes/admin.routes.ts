import express from 'express';
import { syncFulfillmentStatuses } from '../controllers/admin.controller.js';

const router = express.Router();

/**
 * Dev-only admin utilities
 */
router.post('/sync-fulfillment', syncFulfillmentStatuses);

export default router;

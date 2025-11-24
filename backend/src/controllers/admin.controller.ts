/**
 * @module controllers/admin
 * @description Admin utilities (dev-only)
 * @since 2025-11-24
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { syncAllPrintfulOrders } from '../services/printful.service.js';

const isAdminToolsEnabled = () => {
  const flag = process.env.ALLOW_ADMIN_SYNC || '';
  const allowFlag = flag.trim().toLowerCase() === 'true';
  return process.env.NODE_ENV === 'development' || allowFlag;
};

/**
 * Sync all Printful orders into local DB (dev-only)
 * POST /api/admin/sync-fulfillment
 */
export const syncFulfillmentStatuses = catchAsync(async (_req: Request, res: Response) => {
  if (!isAdminToolsEnabled()) {
    throw new AppError('Admin tools disabled outside development', 403);
  }

  const result = await syncAllPrintfulOrders();

  res.json({
    success: true,
    data: result,
    message: `Synced ${result.updated} of ${result.total} orders`,
  });
});

export default {
  syncFulfillmentStatuses,
};

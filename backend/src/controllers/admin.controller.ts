/**
 * @module controllers/admin
 * @description Admin utilities (dev-only)
 * @since 2025-11-24
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { syncAllPrintfulOrders, fetchPrintfulProductVariants } from '../services/printful.service.js';
import prisma from '../config/database.js';
import crypto from 'crypto';

/**
 * Sync all Printful orders into local DB (dev-only)
 * POST /api/admin/sync-fulfillment
 */
export const syncFulfillmentStatuses = catchAsync(async (_req: Request, res: Response) => {
  const result = await syncAllPrintfulOrders();

  res.json({
    success: true,
    data: result,
    message: `Synced ${result.updated} of ${result.total} orders`,
  });
});

/**
 * Dev/admin: create a promo/gift code.
 * POST /api/admin/promo-codes
 */
export const createPromoCode = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  const { code, type, productTier, percentOff, usageLimit, disabled } = req.body;
  const skipAuth = (process.env.SKIP_AUTH || '').toLowerCase() === 'true';
  const createdByUserId = skipAuth ? null : req.user.id;

  if (!type || !['FREE_PRODUCT', 'PERCENT_OFF'].includes(String(type))) {
    throw new AppError('type must be FREE_PRODUCT or PERCENT_OFF', 400);
  }

  if (type === 'PERCENT_OFF') {
    if (!percentOff || Number(percentOff) <= 0) {
      throw new AppError('percentOff must be provided for PERCENT_OFF codes', 400);
    }
  }

  if (type === 'FREE_PRODUCT' && productTier && !['LIMITLESS'].includes(String(productTier))) {
    throw new AppError('productTier must be LIMITLESS for FREE_PRODUCT codes', 400);
  }

  const generatedCode = (code as string | undefined)?.trim() || crypto.randomUUID().slice(0, 12).toUpperCase();

  const promo = await prisma.promoCode.create({
    data: {
      code: generatedCode,
      type,
      productTier: productTier || null,
      percentOff: percentOff ? Number(percentOff) : null,
      usageLimit: usageLimit === null || usageLimit === undefined ? null : Number(usageLimit),
      usageCount: 0,
      createdByUserId,
      disabled: Boolean(disabled),
    },
  });

  res.json({
    success: true,
    data: promo,
  });
});

/**
 * Fetch Printful variants for a product (admin utility)
 * GET /api/admin/printful/variants?productId=71&color=Navy
 */
export const getPrintfulVariants = catchAsync(async (req: Request, res: Response) => {
  const productId = (req.query.productId as string | undefined)?.trim();
  const colorFilter = (req.query.color as string | undefined)?.trim();

  if (!productId) {
    throw new AppError('productId is required', 400);
  }

  const variants = await fetchPrintfulProductVariants(productId);

  const filtered = colorFilter
    ? variants.filter((v) => v.color.toLowerCase() === colorFilter.toLowerCase())
    : variants;

  res.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      productId,
      color: colorFilter || null,
    },
  });
});

/**
 * List promo/gift codes with filters and pagination.
 */
export const listPromoCodes = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10) || 20));
  const search = (req.query.search as string | undefined)?.trim();
  const type = req.query.type as string | undefined;
  const tier = req.query.tier as string | undefined;
  const disabled = req.query.disabled as string | undefined;
  const createdBy = req.query.createdBy as string | undefined;
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const where: any = {};
  if (search) {
    where.code = { contains: search, mode: 'insensitive' };
  }
  if (type && ['FREE_PRODUCT', 'PERCENT_OFF'].includes(type)) {
    where.type = type as any;
  }
  if (tier && ['LIMITLESS'].includes(tier)) {
    where.productTier = tier as any;
  }
  if (disabled === 'true' || disabled === 'false') {
    where.disabled = disabled === 'true';
  }
  if (createdBy) {
    where.createdByUserId = createdBy;
  }
  if (from || to) {
    where.createdAt = {
      gte: from || undefined,
      lte: to || undefined,
    };
  }

  const [items, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: true,
      },
    }),
    prisma.promoCode.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * Get single promo/gift code with recent orders.
 */
export const getPromoCodeDetail = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!promo) {
    throw new AppError('Promo code not found', 404);
  }

  const recentOrders = await prisma.order.findMany({
    where: { promoCodeId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      payment: true,
    },
    take: 10,
  });

  res.json({
    success: true,
    data: {
      promo,
      recentOrders,
    },
  });
});

/**
 * Aggregate metrics across promo/gift codes.
 */
export const getPromoCodesMetrics = catchAsync(async (req: Request, res: Response) => {
  const bucket = (req.query.bucket as string) === 'week' ? 'week' : 'day';
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const params: any[] = [bucket];
  let paramIndex = 2;
  const filters: string[] = ['o."promoCodeId" IS NOT NULL', 'o."paidAt" IS NOT NULL'];
  if (from) {
    filters.push(`o."paidAt" >= $${paramIndex++}`);
    params.push(from);
  }
  if (to) {
    filters.push(`o."paidAt" <= $${paramIndex++}`);
    params.push(to);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const series = await prisma.$queryRawUnsafe(
    `SELECT date_trunc($1, o."paidAt") as bucket,
        COUNT(*)::int as redemptions,
        COALESCE(SUM(o."totalAmount"),0)::float as revenue
      FROM "orders" o
      ${whereClause}
      GROUP BY 1
      ORDER BY 1`,
    ...params
  );

  const totals = await prisma.order.aggregate({
    where: {
      promoCodeId: { not: null },
      paidAt: {
        gte: from || undefined,
        lte: to || undefined,
      },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  const activeCodes = await prisma.promoCode.count({
    where: { disabled: false },
  });

  res.json({
    success: true,
    data: {
      totals: {
        redemptions: totals._count._all || 0,
        revenue: Number(totals._sum.totalAmount || 0),
        activeCodes,
      },
      series,
    },
  });
});

/**
 * Metrics for a single promo/gift code.
 */
export const getPromoCodeMetricsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const bucket = (req.query.bucket as string) === 'week' ? 'week' : 'day';
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) {
    throw new AppError('Promo code not found', 404);
  }

  const params: any[] = [bucket, id];
  let paramIndex = 3;
  const filters: string[] = ['o."promoCodeId" = $2', 'o."paidAt" IS NOT NULL'];
  if (from) {
    filters.push(`o."paidAt" >= $${paramIndex++}`);
    params.push(from);
  }
  if (to) {
    filters.push(`o."paidAt" <= $${paramIndex++}`);
    params.push(to);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const series = await prisma.$queryRawUnsafe(
    `SELECT date_trunc($1, o."paidAt") as bucket,
        COUNT(*)::int as redemptions,
        COALESCE(SUM(o."totalAmount"),0)::float as revenue
      FROM "orders" o
      ${whereClause}
      GROUP BY 1
      ORDER BY 1`,
    ...params
  );

  const totals = await prisma.order.aggregate({
    where: {
      promoCodeId: id,
      paidAt: {
        gte: from || undefined,
        lte: to || undefined,
      },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  res.json({
    success: true,
    data: {
      promo,
      totals: {
        redemptions: totals._count._all || 0,
        revenue: Number(totals._sum.totalAmount || 0),
        remaining:
          promo.usageLimit !== null && promo.usageLimit !== undefined
            ? Math.max(0, promo.usageLimit - promo.usageCount)
            : null,
      },
      series,
    },
  });
});

/**
 * Soft-disable a promo code.
 */
export const disablePromoCode = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { disabled: true },
  });
  res.json({ success: true, data: updated });
});

/**
 * Re-enable a promo code.
 */
export const enablePromoCode = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { disabled: false },
  });
  res.json({ success: true, data: updated });
});

export default {
  syncFulfillmentStatuses,
  createPromoCode,
  listPromoCodes,
  getPromoCodeDetail,
  getPromoCodesMetrics,
  getPromoCodeMetricsById,
  disablePromoCode,
  enablePromoCode,
};

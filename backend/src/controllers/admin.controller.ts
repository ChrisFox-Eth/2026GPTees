/**
 * @module controllers/admin
 * @description Admin utilities (dev-only)
 * @since 2025-11-24
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { syncAllPrintfulOrders, fetchPrintfulProductVariants } from '../services/printful.service.js';
import { EMAIL_TEMPLATES, buildEmailHtml } from '../services/email-templates.js';
import prisma from '../config/database.js';
import crypto from 'crypto';

/**
 * @route POST /api/admin/sync-fulfillment
 * @description Syncs all Printful order statuses to local database (development only)
 * @access Admin only
 *
 * @param {Request} _req - Express request (unused)
 * @param {Response} res - Express response
 *
 * @returns {Object} Sync results (total, updated count)
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
 * @route POST /api/admin/promo-codes
 * @description Creates a new promo or gift code
 * @access Admin only
 *
 * @param {Request} req - Express request (body: code, type, productTier, percentOff, usageLimit, disabled)
 * @param {Response} res - Express response
 *
 * @returns {Object} Created promo code details
 * @throws {401} Authentication required
 * @throws {400} Invalid type (must be FREE_PRODUCT or PERCENT_OFF)
 * @throws {400} Invalid percentOff for PERCENT_OFF codes
 * @throws {400} Invalid productTier for FREE_PRODUCT codes
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
 * @route GET /api/admin/printful/variants
 * @description Fetches Printful product variants (admin utility for debugging)
 * @access Admin only
 *
 * @param {Request} req - Express request (query: productId, color optional)
 * @param {Response} res - Express response
 *
 * @returns {Object} Array of Printful variants with metadata
 * @throws {400} productId is required
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
 * @route GET /api/admin/promo-codes
 * @description Lists promo/gift codes with filters and pagination
 * @access Admin only
 *
 * @param {Request} req - Express request (query: page, pageSize, search, type, tier, disabled, createdBy, from, to)
 * @param {Response} res - Express response
 *
 * @returns {Object} Paginated list of promo codes with metadata
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
 * @route GET /api/admin/promo-codes/:id
 * @description Gets single promo/gift code with recent order history
 * @access Admin only
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Promo code details and recent orders
 * @throws {404} Promo code not found
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
 * @route GET /api/admin/promo-codes/metrics
 * @description Aggregates metrics across all promo/gift codes
 * @access Admin only
 *
 * @param {Request} req - Express request (query: bucket, from, to)
 * @param {Response} res - Express response
 *
 * @returns {Object} Aggregate metrics (redemptions, revenue, time series)
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
 * @route GET /api/admin/promo-codes/:id/metrics
 * @description Gets metrics for a single promo/gift code
 * @access Admin only
 *
 * @param {Request} req - Express request (params.id, query: bucket, from, to)
 * @param {Response} res - Express response
 *
 * @returns {Object} Promo code metrics (redemptions, revenue, time series, remaining uses)
 * @throws {404} Promo code not found
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
 * @route PATCH /api/admin/promo-codes/:id/disable
 * @description Soft-disables a promo code (prevents further use)
 * @access Admin only
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Updated promo code
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
 * @route PATCH /api/admin/promo-codes/:id/enable
 * @description Re-enables a disabled promo code
 * @access Admin only
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Updated promo code
 */
export const enablePromoCode = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { disabled: false },
  });
  res.json({ success: true, data: updated });
});

/**
 * @route GET /api/admin/email-templates
 * @description Lists all available email template types
 * @access Admin only
 *
 * @param {Request} _req - Express request (unused)
 * @param {Response} res - Express response
 *
 * @returns {Object} Array of template names and descriptions
 */
export const listEmailTemplates = catchAsync(async (_req: Request, res: Response) => {
  const templates = [
    { name: 'orderConfirmed', description: 'Order confirmation email sent after successful payment' },
    { name: 'designApproved', description: 'Design approval confirmation email' },
    { name: 'orderShipped', description: 'Shipping notification email' },
    { name: 'abandonedCheckout', description: 'Abandoned cart recovery email' },
    { name: 'studioTips', description: 'Design studio tips email' },
    { name: 'giftCode', description: 'Gift code email' },
  ];

  res.json({
    success: true,
    data: templates,
  });
});

/**
 * @route GET /api/admin/email-templates/:name/preview
 * @description Previews an email template with sample data
 * @access Admin only
 *
 * @param {Request} req - Express request (params.name required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Email preview with subject, HTML, and template config
 * @throws {400} Invalid template name
 */
export const previewEmailTemplate = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.params;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  let template;
  switch (name) {
    case 'orderConfirmed':
      template = EMAIL_TEMPLATES.orderConfirmed('ORDER-12345', `${FRONTEND_URL}/design?orderId=123`);
      break;
    case 'designApproved':
      template = EMAIL_TEMPLATES.designApproved('ORDER-12345');
      break;
    case 'orderShipped':
      template = EMAIL_TEMPLATES.orderShipped('ORDER-12345', 'https://tracking.example.com/1Z999AA10123456784');
      break;
    case 'abandonedCheckout':
      template = EMAIL_TEMPLATES.abandonedCheckout(`${FRONTEND_URL}/cart?resume=123`);
      break;
    case 'studioTips':
      template = EMAIL_TEMPLATES.studioTips(`${FRONTEND_URL}/design?orderId=123`);
      break;
    case 'giftCode':
      template = EMAIL_TEMPLATES.giftCode('GIFT-2024-ABCD', `${FRONTEND_URL}/shop`);
      break;
    default:
      throw new AppError('Invalid template name', 400);
  }

  const html = buildEmailHtml(template);

  res.json({
    success: true,
    data: {
      name,
      subject: template.subject,
      html,
      config: template,
    },
  });
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
  getPrintfulVariants,
  listEmailTemplates,
  previewEmailTemplate,
};

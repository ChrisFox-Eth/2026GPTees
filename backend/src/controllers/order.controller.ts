/**
 * @module controllers/order
 * @description Order management controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import prisma from '../config/database.js';
import {
  createPrintfulOrder,
  getPrintfulOrderStatus,
  getPrintfulVariantId,
} from '../services/printful.service.js';
import { getTierPricingMap } from '../services/pricing.service.js';
import { TierType } from '../config/pricing.js';
import { sendAnalyticsEvent } from '../services/analytics.service.js';
import { OrderStatus } from '@prisma/client';
import crypto from 'crypto';

/**
 * Get all orders for current user
 * GET /api/orders
 */
export const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      designs: true,
      payment: true,
      address: true,
      promoCode: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: orders,
  });
});

/**
 * Create or reuse a preview order in PENDING_PAYMENT status
 * POST /api/orders/preview
 */
export const createPreviewOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { productId, color, size, tier, quantity } = req.body;

  if (!productId || !color || !size) {
    res.status(400).json({
      success: false,
      message: 'productId, color, and size are required',
    });
    return;
  }

  const normalizedTier = (tier || TierType.BASIC).toString().toUpperCase() as TierType;
  const isSupportedTier = Object.values(TierType).includes(normalizedTier);
  if (!isSupportedTier) {
    throw new AppError('Invalid design tier supplied for preview order', 400);
  }

  const qty = Number(quantity) || 1;
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const [product, tierPricingMap] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    getTierPricingMap(),
  ]);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const tierConfig = tierPricingMap[normalizedTier];
  if (!tierConfig) {
    throw new AppError('Design tier configuration missing', 500);
  }

  const colorOptions = Array.isArray(product.colors) ? (product.colors as Array<{ name: string }>) : [];
  const colorMatch =
    colorOptions.find((c) => c?.name?.toLowerCase() === color.toString().toLowerCase()) ||
    colorOptions[0];

  if (!colorMatch) {
    throw new AppError('Selected color is not available for this product', 400);
  }

  const sizeMatch =
    product.sizes.find((s) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

  if (!sizeMatch) {
    throw new AppError('Selected size is not available for this product', 400);
  }

  const variantId = getPrintfulVariantId(product.printfulId, colorMatch.name, sizeMatch);
  if (!variantId) {
    throw new AppError(
      `Selected variant unavailable: ${product.name} (${colorMatch.name} / ${sizeMatch}). Please choose a supported color/size.`,
      400
    );
  }

  const unitPrice = Number(product.basePrice) + tierConfig.price;
  const totalAmount = unitPrice * qty;

  const reusableOrder = await prisma.order.findFirst({
    where: {
      userId: req.user.id,
      status: OrderStatus.PENDING_PAYMENT,
      stripeCheckoutId: null,
      paymentId: null,
      printfulOrderId: null,
    },
    include: { items: true, designs: true },
    orderBy: { createdAt: 'desc' },
  });

  let order;
  let reused = false;

  if (reusableOrder && reusableOrder.items.length === 1) {
    reused = true;
    const existingItem = reusableOrder.items[0];

    if (reusableOrder.designsGenerated > tierConfig.maxDesigns && tierConfig.maxDesigns !== 9999) {
      throw new AppError(
        'Cannot downgrade tier below the number of designs already generated. Please continue with Premium.',
        400
      );
    }

    order = await prisma.order.update({
      where: { id: reusableOrder.id },
      data: {
        designTier: normalizedTier,
        maxDesigns: tierConfig.maxDesigns,
        totalAmount,
        items: {
          update: {
            where: { id: existingItem.id },
            data: {
              productId: product.id,
              size: sizeMatch,
              color: colorMatch.name,
              quantity: qty,
              unitPrice,
              printfulVariantId: variantId.toString(),
            },
          },
        },
      },
      include: { items: true, designs: true },
    });
  } else {
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount,
        designTier: normalizedTier,
        designsGenerated: 0,
        maxDesigns: tierConfig.maxDesigns,
        items: {
          create: [
            {
              productId: product.id,
              size: sizeMatch,
              color: colorMatch.name,
              quantity: qty,
              unitPrice,
              printfulVariantId: variantId.toString(),
            },
          ],
        },
      },
      include: { items: true, designs: true },
    });
  }

  sendAnalyticsEvent({
    event: 'preview.order.created',
    properties: {
      order_id: order.id,
      order_number: order.orderNumber,
      user_id: req.user.id,
      product_id: product.id,
      color: colorMatch.name,
      size: sizeMatch,
      tier: normalizedTier,
      quantity: qty,
      reused,
      total_amount: totalAmount,
      designs_generated: order.designsGenerated,
      max_designs: order.maxDesigns,
    },
  }).catch((err) => console.error('Failed to send preview.order.created analytics', err));

  res.status(reused ? 200 : 201).json({
    success: true,
    data: order,
    message: reused ? 'Reused existing preview order' : 'Preview order created',
  });
});

/**
 * Create a preview order for unauthenticated users (guest), returning a claim token
 * POST /api/orders/preview/guest
 */
export const createGuestPreviewOrder = catchAsync(async (req: Request, res: Response) => {
  const { productId, color, size, tier, quantity } = req.body;

  if (!productId || !color || !size) {
    res.status(400).json({
      success: false,
      message: 'productId, color, and size are required',
    });
    return;
  }

  const normalizedTier = (tier || TierType.PREMIUM).toString().toUpperCase() as TierType;
  const isSupportedTier = Object.values(TierType).includes(normalizedTier);
  if (!isSupportedTier) {
    throw new AppError('Invalid design tier supplied for preview order', 400);
  }

  const qty = Number(quantity) || 1;
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const [product, tierPricingMap] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    getTierPricingMap(),
  ]);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const tierConfig = tierPricingMap[normalizedTier];
  if (!tierConfig) {
    throw new AppError('Design tier configuration missing', 500);
  }

  const colorOptions = Array.isArray(product.colors) ? (product.colors as Array<{ name: string }>) : [];
  const colorMatch =
    colorOptions.find((c) => c?.name?.toLowerCase() === color.toString().toLowerCase()) ||
    colorOptions[0];

  if (!colorMatch) {
    throw new AppError('Selected color is not available for this product', 400);
  }

  const sizeMatch =
    product.sizes.find((s) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

  if (!sizeMatch) {
    throw new AppError('Selected size is not available for this product', 400);
  }

  const variantId = getPrintfulVariantId(product.printfulId, colorMatch.name, sizeMatch);
  if (!variantId) {
    throw new AppError(
      `Selected variant unavailable: ${product.name} (${colorMatch.name} / ${sizeMatch}). Please choose a supported color/size.`,
      400
    );
  }

  const guestToken = crypto.randomUUID();
  const guestEmail = `guest+${guestToken}@guest.gptees`;
  const guestClerkId = `guest_${guestToken}`;

  const guestUser = await prisma.user.create({
    data: {
      email: guestEmail,
      clerkId: guestClerkId,
      firstName: 'Guest',
    },
  });

  const unitPrice = Number(product.basePrice) + tierConfig.price;
  const totalAmount = unitPrice * qty;
  const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: guestUser.id,
      status: OrderStatus.PENDING_PAYMENT,
      totalAmount,
      designTier: normalizedTier,
      designsGenerated: 0,
      maxDesigns: tierConfig.maxDesigns,
      previewGuestToken: guestToken,
      items: {
        create: [
          {
            productId: product.id,
            size: sizeMatch,
            color: colorMatch.name,
            quantity: qty,
            unitPrice,
            printfulVariantId: variantId.toString(),
          },
        ],
      },
    },
    include: { items: true },
  });

  sendAnalyticsEvent({
    event: 'preview.order.guest_created',
    properties: {
      order_id: order.id,
      order_number: order.orderNumber,
      tier: normalizedTier,
      product_id: product.id,
      color: colorMatch.name,
      size: sizeMatch,
      quantity: qty,
      total_amount: totalAmount,
      guest_user_id: guestUser.id,
    },
  }).catch((err) => console.error('Failed to send preview.order.guest_created analytics', err));

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      guestToken,
      tier: normalizedTier,
      maxDesigns: order.maxDesigns,
    },
    message: 'Guest preview order created',
  });
});

/**
 * Claim a guest preview order after authentication
 * POST /api/orders/preview/claim
 */
export const claimPreviewOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { orderId, guestToken } = req.body;

  if (!orderId || !guestToken) {
    res.status(400).json({
      success: false,
      message: 'orderId and guestToken are required',
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || !order.previewGuestToken) {
    throw new AppError('Preview order not found or already claimed', 404);
  }

  if (order.previewGuestToken !== guestToken) {
    throw new AppError('Invalid claim token for this order', 403);
  }

  if (
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.DESIGN_APPROVED ||
    order.status === OrderStatus.SUBMITTED ||
    order.status === OrderStatus.SHIPPED
  ) {
    throw new AppError('This order has already been processed', 400);
  }

  const previousUserId = order.userId;

  const claimed = await prisma.order.update({
    where: { id: orderId },
    data: {
      userId: req.user.id,
      previewGuestToken: null,
    },
    include: { items: true },
  });

  // Clean up guest user if unused
  if (previousUserId !== req.user.id) {
    const remainingOrders = await prisma.order.count({ where: { userId: previousUserId } });
    const remainingDesigns = await prisma.design.count({ where: { userId: previousUserId } });
    if (remainingOrders === 0 && remainingDesigns === 0) {
      try {
        await prisma.user.delete({ where: { id: previousUserId } });
      } catch (err) {
        console.error('Failed to delete guest user after claim', err);
      }
    }
  }

  sendAnalyticsEvent({
    event: 'preview.order.claimed',
    properties: {
      order_id: claimed.id,
      order_number: claimed.orderNumber,
      user_id: req.user.id,
      tier: claimed.designTier,
    },
  }).catch((err) => console.error('Failed to send preview.order.claimed analytics', err));

  res.json({
    success: true,
    data: claimed,
  });
});

/**
 * Update size/color for a preview order item (single-item preview orders)
 * PATCH /api/orders/:id/item
 */
export const updatePreviewItemVariant = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;
  const { color, size } = req.body;

  if (!color || !size) {
    res.status(400).json({
      success: false,
      message: 'color and size are required',
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  if (
    order.status !== OrderStatus.PENDING_PAYMENT &&
    order.status !== OrderStatus.DESIGN_PENDING
  ) {
    throw new AppError('Size and color can only be changed before payment is completed', 400);
  }

  if (!order.items.length) {
    throw new AppError('Order has no items to update', 400);
  }

  const item = order.items[0];
  const product = await prisma.product.findUnique({ where: { id: item.productId } });

  if (!product) {
    throw new AppError('Product not found for this order item', 404);
  }

  const colorOptions = Array.isArray(product.colors) ? (product.colors as Array<{ name: string }>)
    : [];
  const colorMatch =
    colorOptions.find((c) => c?.name?.toLowerCase() === color.toString().toLowerCase()) ||
    colorOptions[0];

  if (!colorMatch) {
    throw new AppError('Selected color is not available for this product', 400);
  }

  const sizeMatch =
    product.sizes.find((s) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

  if (!sizeMatch) {
    throw new AppError('Selected size is not available for this product', 400);
  }

  const variantId = getPrintfulVariantId(product.printfulId, colorMatch.name, sizeMatch);
  if (!variantId) {
    throw new AppError(
      `Selected variant unavailable: ${product.name} (${colorMatch.name} / ${sizeMatch}). Please choose a supported color/size.`,
      400
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      items: {
        update: {
          where: { id: item.id },
          data: {
            color: colorMatch.name,
            size: sizeMatch,
            printfulVariantId: variantId.toString(),
          },
        },
      },
    },
    include: {
      items: {
        include: { product: true },
      },
      designs: true,
    },
  });

  sendAnalyticsEvent({
    event: 'order.preview.variant_updated',
    properties: {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      product_id: product.id,
      color: colorMatch.name,
      size: sizeMatch,
    },
  }).catch((err) => console.error('Failed to send order.preview.variant_updated analytics', err));

  res.json({
    success: true,
    data: updatedOrder,
  });
});

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          design: true,
        },
      },
      designs: true,
      payment: true,
      address: true,
      promoCode: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  res.json({
    success: true,
    data: order,
  });
});

/**
 * Submit an approved design to Printful for fulfillment
 * POST /api/orders/:id/submit-fulfillment
 */
export const submitFulfillment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      designs: {
        where: { approvalStatus: true },
        orderBy: { approvedAt: 'desc' },
      },
      user: true,
      items: {
        include: { product: true },
      },
      address: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  if (
    order.status !== OrderStatus.PAID &&
    order.status !== OrderStatus.DESIGN_APPROVED
  ) {
    throw new AppError('Payment is required before submitting for fulfillment.', 400);
  }

  if (!order.address) {
    throw new AppError('Order is missing a shipping address', 400);
  }

  if (!order.designs.length) {
    throw new AppError('No approved design found for this order', 400);
  }

  // Avoid duplicate submissions
  if (order.printfulOrderId) {
    res.json({
      success: true,
      message: 'Order already submitted to Printful',
      data: { printfulOrderId: order.printfulOrderId },
    });
    return;
  }

  const approvedDesign = order.designs[0];

  const result = await createPrintfulOrder(order.id, approvedDesign.id);

  if (!result.success) {
    // Persist the failure reason so the user can retry later
    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: `ERROR: ${result.error}`,
        status: 'DESIGN_APPROVED',
      },
    });

    throw new AppError(result.error || 'Failed to submit order to Printful', 400);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      fulfillmentStatus: 'submitted',
    },
  });

  res.json({
    success: true,
    data: {
      printfulOrderId: result.printfulOrderId,
    },
    message: 'Order submitted for fulfillment',
  });
});

/**
 * Get fulfillment tracking/status for an order
 * GET /api/orders/:id/tracking
 */
export const getOrderTracking = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  if (!order.printfulOrderId) {
    res.json({
      success: true,
      data: {
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        trackingNumber: order.trackingNumber,
      },
      message: 'Order not yet submitted to Printful',
    });
    return;
  }

  // Fetch latest status from Printful
  const printfulStatus = await getPrintfulOrderStatus(order.printfulOrderId);

  const tracking = printfulStatus?.shipments?.[0];
  const trackingNumber = tracking?.tracking_number || order.trackingNumber;
  const trackingUrl = tracking?.tracking_url;
  const fulfillmentStatus = printfulStatus?.status || order.fulfillmentStatus;

  const mappedStatus = (() => {
    switch (fulfillmentStatus) {
      case 'fulfilled':
      case 'shipped':
      case 'partial':
        return 'SHIPPED';
      case 'delivered':
        return 'DELIVERED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return order.status;
    }
  })();

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: mappedStatus,
      fulfillmentStatus,
      trackingNumber,
      shippedAt:
        (mappedStatus === 'SHIPPED' && !order.shippedAt) ? new Date() : order.shippedAt,
      deliveredAt:
        (mappedStatus === 'DELIVERED' && !order.deliveredAt) ? new Date() : order.deliveredAt,
    },
  });

  res.json({
    success: true,
    data: {
      status: updatedOrder.status,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
    },
  });
});

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
  mapOrderStatusFromPrintful,
} from '../services/printful.service.js';
import { getTierPricingMap } from '../services/pricing.service.js';
import { TierType } from '../config/pricing.js';
import { sendAnalyticsEvent } from '../services/analytics.service.js';
import { OrderStatus } from '@prisma/client';
import crypto from 'crypto';
import { getOrderActionErrorMessage, isOrderActionAllowed } from '../policies/order-policy.js';

/**
 * @route GET /api/orders
 * @description Retrieves all orders for authenticated user with related data
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (requires req.user)
 * @param {Response} res - Express response
 *
 * @returns {Object} Array of user orders with items, designs, payment, address, promoCode
 * @throws {401} Authentication required
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
 * @route POST /api/orders/preview
 * @description Creates or reuses a preview order in PENDING_PAYMENT status
 * Allows users to test design generation before payment
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (body: productId, color, size, quantity)
 * @param {Response} res - Express response
 *
 * @returns {Object} Preview order with item details
 * @throws {401} Authentication required
 * @throws {400} Missing required fields (productId, color, size)
 * @throws {400} Invalid quantity
 * @throws {404} Product not found
 * @throws {400} Invalid color or size
 * @throws {400} Cannot downgrade tier below designs generated
 */
export const createPreviewOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { productId, color, size, quantity } = req.body;

  if (!productId || !color || !size) {
    res.status(400).json({
      success: false,
      message: 'productId, color, and size are required',
    });
    return;
  }

  const normalizedTier = TierType.LIMITLESS;

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
    product.sizes.find((s: string) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

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

  const unitPrice = tierConfig.price;
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
        designTier: normalizedTier as any,
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
        designTier: normalizedTier as any,
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
 * @route POST /api/orders/preview/guest
 * @description Creates preview order for unauthenticated users with guest token
 * Returns claim token for later authentication
 * @access Public
 *
 * @param {Request} req - Express request (body: productId, color, size, quantity)
 * @param {Response} res - Express response
 *
 * @returns {Object} Guest order details with guestToken for claiming
 * @throws {400} Missing required fields (productId, color, size)
 * @throws {400} Invalid quantity
 * @throws {404} Product not found
 * @throws {400} Invalid color or size
 */
export const createGuestPreviewOrder = catchAsync(async (req: Request, res: Response) => {
  const { productId, color, size, quantity } = req.body;

  if (!productId || !color || !size) {
    res.status(400).json({
      success: false,
      message: 'productId, color, and size are required',
    });
    return;
  }

  const normalizedTier = TierType.LIMITLESS;

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
    product.sizes.find((s: string) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

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

  const unitPrice = tierConfig.price;
  const totalAmount = unitPrice * qty;
  const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: guestUser.id,
      status: OrderStatus.PENDING_PAYMENT,
      totalAmount,
      designTier: normalizedTier as any,
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
 * @route POST /api/orders/preview/claim
 * @description Claims a guest preview order after user authentication
 * Transfers order and designs to authenticated user
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (body: orderId, guestToken)
 * @param {Response} res - Express response
 *
 * @returns {Object} Claimed order with items
 * @throws {401} Authentication required
 * @throws {400} Missing orderId or guestToken
 * @throws {404} Preview order not found or already claimed
 * @throws {403} Invalid claim token
 * @throws {400} Order already processed (paid/approved/shipped)
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

  if (!isOrderActionAllowed('order_claim_preview', order.status as OrderStatus)) {
    throw new AppError(getOrderActionErrorMessage('order_claim_preview'), 400);
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

  // Reassign any guest designs on this order to the authenticated user
  await prisma.design.updateMany({
    where: {
      orderId,
    },
    data: {
      userId: req.user.id,
    },
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
 * @route PATCH /api/orders/:id/item
 * @description Updates size/color for preview order (single-item orders only)
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (params.id, body: color, size)
 * @param {Response} res - Express response
 *
 * @returns {Object} Updated order with new variant details
 * @throws {401} Authentication required
 * @throws {400} Missing color or size
 * @throws {404} Order not found
 * @throws {403} Unauthorized access to order
 * @throws {400} Cannot change variant after payment
 * @throws {400} Invalid color or size
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

  if (!isOrderActionAllowed('order_preview_variant_update', order.status as OrderStatus)) {
    throw new AppError(getOrderActionErrorMessage('order_preview_variant_update'), 400);
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
    product.sizes.find((s: string) => s.toLowerCase() === size.toString().toLowerCase()) || product.sizes[0];

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
 * @route GET /api/orders/:id
 * @description Retrieves single order with full details
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Order with items, designs, payment, address, promoCode
 * @throws {401} Authentication required
 * @throws {404} Order not found
 * @throws {403} Unauthorized access to order
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
 * @route POST /api/orders/:id/submit-fulfillment
 * @description Submits approved design to Printful for fulfillment
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Printful order ID
 * @throws {401} Authentication required
 * @throws {404} Order not found
 * @throws {403} Unauthorized access to order
 * @throws {400} Payment required before fulfillment
 * @throws {400} Missing shipping address
 * @throws {400} No approved design found
 * @throws {400} Printful submission failed
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

  if (!isOrderActionAllowed('order_submit_fulfillment', order.status as OrderStatus)) {
    throw new AppError(getOrderActionErrorMessage('order_submit_fulfillment'), 400);
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
 * @route GET /api/orders/:id/tracking
 * @description Retrieves fulfillment tracking and status from Printful
 * @access Protected (requires authentication)
 *
 * @param {Request} req - Express request (params.id required)
 * @param {Response} res - Express response
 *
 * @returns {Object} Order status, tracking number, tracking URL
 * @throws {401} Authentication required
 * @throws {404} Order not found
 * @throws {403} Unauthorized access to order
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

  const mapping = mapOrderStatusFromPrintful(fulfillmentStatus || undefined);
  const mappedStatus = mapping.orderStatus || order.status;

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: mappedStatus,
      fulfillmentStatus,
      trackingNumber,
      shippedAt:
        (mapping.markShipped && !order.shippedAt) ? new Date() : order.shippedAt,
      deliveredAt:
        (mapping.markDelivered && !order.deliveredAt) ? new Date() : order.deliveredAt,
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

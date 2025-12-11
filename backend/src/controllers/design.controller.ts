/**
 * @module controllers/design
 * @description Design generation controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { generateDesign, generateRandomPrompt } from '../services/openai.service.js';
import { uploadImage } from '../services/supabase-storage.service.js';
import { createPrintfulOrder } from '../services/printful.service.js';
import { sendDesignApproved } from '../services/email.service.js';
import prisma from '../config/database.js';
import { sendAnalyticsEvent } from '../services/analytics.service.js';
import { OrderStatus } from '@prisma/client';
import { getSupabaseServiceRoleClient } from '../services/supabase-admin.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate AI design
 * POST /api/designs/generate
 */
export const createDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { orderId, prompt, style } = req.body;

  if (!orderId || !prompt) {
    res.status(400).json({
      success: false,
      message: 'Order ID and prompt are required',
    });
    return;
  }

  // Get order and verify it belongs to user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  const allowedStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.DESIGN_PENDING,
    OrderStatus.PENDING_PAYMENT,
  ];
  if (!allowedStatuses.includes(order.status as OrderStatus)) {
    throw new AppError(
      'Order must be active or pending payment before generating designs',
      400
    );
  }

  // Check tier limits
  if (order.designsGenerated >= order.maxDesigns) {
    sendAnalyticsEvent({
      event: 'design.generate.limit_hit',
      properties: {
        order_id: order.id,
        order_number: order.orderNumber,
        user_id: req.user.id,
        tier: order.designTier,
        max_designs: order.maxDesigns,
        designs_generated: order.designsGenerated,
        is_preview: order.status === OrderStatus.PENDING_PAYMENT,
      },
    }).catch((err) => console.error('Failed to send design.generate.limit_hit analytics', err));
    throw new AppError(
      `Design limit reached for ${order.designTier} tier. Upgrade to Premium for unlimited designs.`,
      400
    );
  }

  sendAnalyticsEvent({
    event: 'design.generate.request',
    properties: {
      order_id: order.id,
      order_number: order.orderNumber,
      user_id: req.user.id,
      tier: order.designTier,
      status: order.status,
      designs_generated: order.designsGenerated,
      max_designs: order.maxDesigns,
      prompt_length: prompt.length,
      style: style || 'unspecified',
      is_preview: order.status === OrderStatus.PENDING_PAYMENT,
    },
  }).catch((err) => console.error('Failed to send design.generate.request analytics', err));

  // Generate design with DALL-E 3
  console.log(`Generating design for order ${order.orderNumber}...`);
  const { imageUrl, revisedPrompt } = await generateDesign({
    prompt,
    style,
  });

  // Create design record in database (with temporary OpenAI URL so we have an ID)
  const design = await prisma.design.create({
    data: {
      userId: req.user.id,
      orderId,
      prompt,
      revisedPrompt,
      aiModel: 'dall-e-3',
      imageUrl, // Temporary OpenAI URL
      thumbnailUrl: imageUrl,
      status: 'GENERATING',
      style: style || null,
    },
  });

  // Mark completed immediately with the OpenAI URL so we can return quickly
  const completedDesign = await prisma.design.update({
    where: { id: design.id },
    data: {
      imageUrl,
      thumbnailUrl: imageUrl,
      status: 'COMPLETED',
    },
  });

  // Increment design counter
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      designsGenerated: order.designsGenerated + 1,
      status: 'DESIGN_PENDING',
    },
  });

  res.json({
    success: true,
    data: {
      ...completedDesign,
      remainingDesigns:
        order.maxDesigns === 9999
          ? 'unlimited'
          : Math.max(updatedOrder.maxDesigns - updatedOrder.designsGenerated, 0),
    },
  });

  sendAnalyticsEvent({
    event: 'design.generate.success',
    properties: {
      order_id: order.id,
      order_number: order.orderNumber,
      design_id: completedDesign.id,
      user_id: req.user.id,
      tier: order.designTier,
      status: updatedOrder.status,
      designs_generated: updatedOrder.designsGenerated,
      max_designs: updatedOrder.maxDesigns,
      is_preview: order.status === OrderStatus.PENDING_PAYMENT,
    },
  }).catch((err) => console.error('Failed to send design.generate.success analytics', err));

  // Kick off Supabase upload in the background to avoid request timeouts
  uploadImage(imageUrl, design.id)
    .then(async ({ imageUrl: supabaseUrl, thumbnailUrl: supabaseThumbnailUrl }) => {
      await prisma.design.update({
        where: { id: design.id },
        data: {
          imageUrl: supabaseUrl,
          thumbnailUrl: supabaseThumbnailUrl,
          updatedAt: new Date(),
        },
      });
      console.log(`Design ${design.id} uploaded to Supabase Storage`);
    })
    .catch((error) => {
      console.error('Supabase upload error (non-blocking):', error);
    });
});

/**
 * Generate AI design for guest previews (guestToken auth)
 * POST /api/designs/generate/guest
 */
export const createDesignGuest = catchAsync(async (req: Request, res: Response) => {
  const { orderId, prompt, style, guestToken } = req.body;

  if (!orderId || !prompt || !guestToken) {
    res.status(400).json({
      success: false,
      message: 'Order ID, prompt, and guest token are required',
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Ensure the order's user still exists (guest rows can be missing)
  const designUser = await prisma.user.findUnique({ where: { id: order.userId } });
  if (!designUser) {
    await prisma.user.create({
      data: {
        id: order.userId,
        email: `guest+${order.id}@guest.gptees`,
        clerkId: `guest_repair_${order.id}`,
        firstName: 'Guest',
      },
    });
  }

  if (order.previewGuestToken !== guestToken) {
    throw new AppError('Invalid guest token for this preview order', 403);
  }

  const allowedStatuses: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.DESIGN_PENDING,
  ];
  if (!allowedStatuses.includes(order.status as OrderStatus)) {
    throw new AppError(
      'Order must be an unpaid preview before generating designs',
      400
    );
  }

  if (order.designsGenerated >= order.maxDesigns) {
    throw new AppError(
      `Design limit reached for ${order.designTier} tier. Please sign in and upgrade.`,
      400
    );
  }

  console.log(`Generating design for guest order ${order.orderNumber}...`);
  const { imageUrl, revisedPrompt } = await generateDesign({
    prompt,
    style,
  });

  const design = await prisma.design.create({
    data: {
      userId: order.userId,
      orderId,
      prompt,
      revisedPrompt,
      aiModel: 'dall-e-3',
      imageUrl,
      thumbnailUrl: imageUrl,
      status: 'GENERATING',
      style,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      designsGenerated: order.designsGenerated + 1,
      status: 'DESIGN_PENDING',
    },
  });

  // Mark completed immediately so the client can proceed; upload to Supabase in background
  const completedDesign = await prisma.design.update({
    where: { id: design.id },
    data: {
      imageUrl,
      thumbnailUrl: imageUrl,
      status: 'COMPLETED',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Design generation started',
    data: completedDesign,
  });

  uploadImage(imageUrl, design.id)
    .then(async ({ imageUrl: supabaseUrl, thumbnailUrl: supabaseThumbnailUrl }) => {
      await prisma.design.update({
        where: { id: design.id },
        data: {
          imageUrl: supabaseUrl,
          thumbnailUrl: supabaseThumbnailUrl,
          updatedAt: new Date(),
        },
      });
      console.log(`Guest design ${design.id} uploaded to Supabase Storage`);
    })
    .catch((error) => {
      console.error('Supabase upload error (guest non-blocking):', error);
    });
});

/**
 * Get design by ID
 * GET /api/designs/:id
 */
export const getDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      order: true,
    },
  });

  if (!design) {
    throw new AppError('Design not found', 404);
  }

  if (design.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this design', 403);
  }

  res.json({
    success: true,
    data: design,
  });
});

/**
 * Get designs for an order
 * GET /api/designs?orderId=xxx
 */
export const getDesignsByOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { orderId } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Order ID is required',
    });
    return;
  }

  // Verify order belongs to user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this order', 403);
  }

  const designs = await prisma.design.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: designs,
  });
});

/**
 * Clone an existing design into a new preview order
 * POST /api/designs/clone
 */
export const cloneDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const { sourceDesignId, targetOrderId } = req.body as { sourceDesignId?: string; targetOrderId?: string };

  if (!sourceDesignId || !targetOrderId) {
    res.status(400).json({ success: false, message: 'sourceDesignId and targetOrderId are required' });
    return;
  }

  const sourceDesign = await prisma.design.findUnique({
    where: { id: sourceDesignId },
    include: { order: true },
  });

  if (!sourceDesign) {
    throw new AppError('Source design not found', 404);
  }

  if (!sourceDesign.imageUrl || sourceDesign.imageUrl.toLowerCase().includes('oaidalle') || sourceDesign.imageUrl.toLowerCase().includes('openai')) {
    throw new AppError('Source design image is not available in durable storage. Please regenerate.', 400);
  }

  const targetOrder = await prisma.order.findUnique({
    where: { id: targetOrderId },
    include: { items: true },
  });

  if (!targetOrder) {
    throw new AppError('Target order not found', 404);
  }

  if (targetOrder.userId !== req.user.id) {
    throw new AppError('Unauthorized access to target order', 403);
  }

  if (
    targetOrder.status !== OrderStatus.PENDING_PAYMENT &&
    targetOrder.status !== OrderStatus.DESIGN_PENDING
  ) {
    throw new AppError('Target order must be an unpaid preview order', 400);
  }

  const cloned = await prisma.design.create({
    data: {
      id: uuidv4(),
      userId: req.user.id,
      orderId: targetOrderId,
      prompt: sourceDesign.prompt,
      revisedPrompt: sourceDesign.revisedPrompt,
      aiModel: sourceDesign.aiModel,
      imageUrl: sourceDesign.imageUrl,
      thumbnailUrl: sourceDesign.thumbnailUrl || sourceDesign.imageUrl,
      status: 'COMPLETED',
      style: sourceDesign.style,
      approvalStatus: false,
    },
  });

  sendAnalyticsEvent({
    event: 'design.clone.success',
    properties: {
      source_design_id: sourceDesignId,
      target_order_id: targetOrderId,
      user_id: req.user.id,
    },
  }).catch((err) => console.error('Failed to send design.clone.success analytics', err));

  res.status(201).json({
    success: true,
    message: 'Design cloned successfully',
    data: cloned,
  });
});

/**
 * Public design gallery feed (no auth)
 * GET /api/designs/gallery?limit=12
 */
export const getDesignGallery = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  const fetchPool = Math.max(limit * 5, 60); // pull a larger pool to randomize client-side

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('designs')
    .select('id,prompt,revisedPrompt,imageUrl,thumbnailUrl,createdAt')
    .in('status', ['COMPLETED', 'APPROVED'])
    .not('imageUrl', 'is', null)
    .neq('imageUrl', '')
    .order('createdAt', { ascending: false })
    .limit(fetchPool);

  if (error) {
    throw new AppError(`Failed to load gallery: ${error.message}`, 500);
  }

  const pool = data || [];

  // Shuffle pool to avoid the same set each time; return a random slice of the requested size
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  res.json({
    success: true,
    data: pool.slice(0, limit),
  });
});

/**
 * Approve design
 * POST /api/designs/:id/approve
 */
export const approveDesign = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { id } = req.params;

  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!design) {
    throw new AppError('Design not found', 404);
  }

  if (!design.order) {
    throw new AppError('Design has no associated order', 400);
  }

  if (design.userId !== req.user.id) {
    throw new AppError('Unauthorized access to this design', 403);
  }

  if (design.order.status !== OrderStatus.PAID && design.order.status !== OrderStatus.DESIGN_APPROVED) {
    throw new AppError('Payment is required before approving a design. Please checkout first.', 400);
  }

  // Update design approval
  await prisma.design.update({
    where: { id },
    data: {
      approvalStatus: true,
      approvedAt: new Date(),
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id: design.orderId! },
    data: {
      status: 'DESIGN_APPROVED',
    },
  });

  // Send design approved email (non-blocking)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  sendDesignApproved({
    customerName: design.order.user.firstName || design.order.user.email,
    customerEmail: design.order.user.email,
    orderNumber: design.order.orderNumber,
    designImageUrl: design.imageUrl,
    orderUrl: `${frontendUrl}/orders/${design.orderId}`,
  }).catch((error) => {
    console.error('Failed to send design approved email:', error);
  });

  // Submit order to Printful for fulfillment (non-blocking)
  // This runs in the background to not block the user response
  createPrintfulOrder(design.orderId!, id)
    .then((result) => {
      if (result.success) {
        console.log(`✓ Order ${design.orderId} submitted to Printful: ${result.printfulOrderId}`);
      } else {
        console.error(`❌ Failed to submit order ${design.orderId} to Printful:`, result.error);
        // NOTE: In production, you'd want to send an alert/notification here
        // or add the order to a retry queue
      }
    })
    .catch((error) => {
      console.error('Unexpected error submitting to Printful:', error);
    });

  res.json({
    success: true,
    message: 'Design approved successfully! Your order is being submitted for printing.',
  });
});

/**
 * Get random prompt (Surprise Me feature)
 * GET /api/designs/random-prompt
 */
export const getRandomPrompt = catchAsync(async (_req: Request, res: Response) => {
  const prompt = generateRandomPrompt();

  res.json({
    success: true,
    data: { prompt },
  });
});

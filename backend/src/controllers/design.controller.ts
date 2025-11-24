/**
 * @module controllers/design
 * @description Design generation controllers
 * @since 2025-11-21
 */

import { Request, Response } from 'express';
import { catchAsync, AppError } from '../middleware/error.middleware.js';
import { generateDesign, generateRandomPrompt } from '../services/openai.service.js';
import { uploadImage } from '../services/s3.service.js';
import { uploadImageWithFallback } from '../services/supabase-storage.service.js';
import { createPrintfulOrder } from '../services/printful.service.js';
import { sendDesignApproved } from '../services/email.service.js';
import prisma from '../config/database.js';

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

  if (order.status !== 'PAID') {
    throw new AppError('Order must be paid before generating designs', 400);
  }

  // Check tier limits
  if (order.designsGenerated >= order.maxDesigns) {
    throw new AppError(
      `Design limit reached for ${order.designTier} tier. Upgrade to Premium for unlimited designs.`,
      400
    );
  }

  // Generate design with DALL-E 3
  console.log(`Generating design for order ${order.orderNumber}...`);
  const { imageUrl, revisedPrompt } = await generateDesign({
    prompt,
    style,
  });

  // Create design record in database (with temporary OpenAI URL)
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

  // Upload to persistent storage in background (Supabase → S3 fallback → temporary)
  uploadImageWithFallback(imageUrl, design.id, uploadImage)
    .then(async ({ imageUrl: storageUrl, thumbnailUrl: storageThumbnailUrl, storage }) => {
      await prisma.design.update({
        where: { id: design.id },
        data: {
          imageUrl: storageUrl,
          thumbnailUrl: storageThumbnailUrl,
          status: 'COMPLETED',
        },
      });
      console.log(`✅ Design ${design.id} uploaded to ${storage} storage`);

      // Warn if using temporary storage
      if (storage === 'temporary') {
        console.warn(`⚠️  Design ${design.id} using temporary OpenAI URL - will expire in 1 hour! Please configure Supabase or S3 storage.`);
      }
    })
    .catch((error) => {
      console.error('❌ All storage uploads failed:', error);
      // Mark as completed even if upload fails (keeps OpenAI URL)
      prisma.design.update({
        where: { id: design.id },
        data: { status: 'COMPLETED' },
      });
    });

  // Increment design counter
  await prisma.order.update({
    where: { id: orderId },
    data: {
      designsGenerated: order.designsGenerated + 1,
      status: 'DESIGN_PENDING',
    },
  });

  res.json({
    success: true,
    data: {
      ...design,
      remainingDesigns:
        order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns - (order.designsGenerated + 1),
    },
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

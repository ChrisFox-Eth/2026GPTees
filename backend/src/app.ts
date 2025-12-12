import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import productRoutes from './routes/product.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import designRoutes from './routes/design.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import giftCodeRoutes from './routes/giftcode.routes.js';
import promoCodeRoutes from './routes/promocode.routes.js';

export function createApp() {
  const app = express();

  /**
   * Security Middleware
   */
  app.use(helmet());

  /**
   * @constant allowedOrigins
   * @description Allowed CORS origins for frontend applications
   */
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://2026-gp-tees.vercel.app',
    'https://www.gptees.app',
    'https://gptees.app',
    'http://localhost:5173',
  ];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  /**
   * Webhook routes (before body parser for raw body)
   */
  app.use('/api/webhooks', webhookRoutes);

  /**
   * Body parsing middleware
   */
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /**
   * Logging middleware
   */
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  /**
   * API Routes
   */
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/designs', designRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/gift-codes', giftCodeRoutes);
  app.use('/api/promo', promoCodeRoutes);

  // Add more routes here as needed
  // Printful and email integrations pending

  /**
   * Error Handling
   */
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

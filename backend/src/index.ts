/**
 * @module backend/index
 * @description Express server entry point and configuration
 * Initializes the Express application, loads environment variables,
 * sets up middleware, and starts the HTTP server.
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @requires dotenv
 * @requires express
 * @requires cors
 *
 * @features
 * - Environment variable loading via dotenv
 * - CORS support for frontend communication
 * - JSON request parsing middleware
 * - API route organization
 * - Error handling middleware
 * - Server startup logging
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routes
import healthRoutes from '@routes/health.routes';

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware setup
 */

/**
 * CORS configuration for frontend communication
 * Adjust origins as needed for production
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

/**
 * Body parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Logging middleware for development
 */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes
 */
app.use('/api/health', healthRoutes);

// Add more routes here as needed
// import userRoutes from '@routes/user.routes';
// app.use('/api/users', userRoutes);

/**
 * 404 error handler for undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

/**
 * Global error handler
 * Catches any errors thrown by routes or middleware
 */
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
    });
  }
);

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;

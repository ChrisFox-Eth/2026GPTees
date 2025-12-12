/**
 * @module index
 * @description Express server entry point for 2026GPTees backend API
 * Configures middleware, routes, error handling, and database connection
 * @since 2025-11-21
 */

import 'dotenv/config';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';

/**
 * @constant app
 * @description Express application instance
 */
const app = createApp();

/**
 * @constant PORT
 * @description Server port from environment or default 5000
 */
const PORT = process.env.PORT || 5000;

// Routing + middleware are mounted in createApp() (see src/app.ts)

/**
 * @function startServer
 * @description Initializes database connection and starts Express server
 * Handles graceful error handling and process exit on failure
 *
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log('==========================================');
      console.log('✓ 2026GPTees Backend Server');
      console.log('==========================================');
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('==========================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * @event unhandledRejection
 * @description Handles unhandled promise rejections and exits process
 */
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;

/**
 * @module middlewares/example
 * @description Example middleware demonstrating the middleware pattern
 * Middlewares process requests before they reach controllers
 * This example shows how to structure middleware for authentication, logging, validation, etc.
 *
 * @since 2025-10-20
 * @author Template
 *
 * @features
 * - Request intercepting
 * - Request validation
 * - Authentication checks
 * - Error handling
 * - Request logging
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request type to include custom properties
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isAuthenticated?: boolean;
    }
  }
}

/**
 * Example authentication middleware
 * Checks if a user is authenticated and attaches user info to the request
 * Replace with your actual authentication logic (JWT verification, session check, etc.)
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 *
 * @throws {Error} If authentication fails
 *
 * @example
 * app.use('/api/protected', authMiddleware);
 *
 * @status Draft
 * @category Authentication
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Example: Check for authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Missing authorization header',
      });
      return;
    }

    // Example: Extract token from "Bearer <token>"
   // const token = authHeader.split(' ')[1];

    // Replace with actual JWT verification or token validation
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.userId = decoded.id;
    // req.isAuthenticated = true;

    // Placeholder: assume token is valid if present
    req.userId = 'user-123';
    req.isAuthenticated = true;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Example request logging middleware
 * Logs incoming requests with method, path, and timestamp
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 *
 * @example
 * app.use(requestLogger);
 *
 * @status Draft
 * @category Logging
 */
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

/**
 * Example validation error handling middleware
 * Catches and formats validation errors
 *
 * @param {any} err - The error object
 * @param {Request} _req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function
 * @returns {void}
 *
 * @example
 * app.use(validationErrorHandler);
 *
 * @status Draft
 * @category Error Handling
 */
export const validationErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.type === 'validation') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
    return;
  }

  // Pass error to next handler if not a validation error
  _next(err);
};

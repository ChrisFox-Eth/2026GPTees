/**
 * @module middleware/error
 * @description Global error handling middleware
 * @since 2025-11-21
 */

import { Request, Response, NextFunction } from 'express';

/**
 * @class AppError
 * @extends Error
 * @description Custom application error class with status code support
 *
 * @property {number} statusCode - HTTP status code for the error
 * @property {boolean} isOperational - Flag indicating if error is operational (vs programmer error)
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  /**
   * @constructor
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @middleware errorHandler
 * @description Global error handler middleware that catches and formats all errors
 * Logs error details and sends appropriate response to client
 *
 * @param {Error} err - Error object (may be AppError with statusCode or generic Error)
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} _next - Express next function (unused)
 *
 * @returns {void}
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
    }),
  });
};

/**
 * @middleware notFoundHandler
 * @description Handles 404 Not Found errors for undefined routes
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * @returns {void}
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
};

/**
 * @function catchAsync
 * @description Wraps async route handlers to automatically catch and forward errors to error middleware
 * Eliminates need for try-catch blocks in async route handlers
 *
 * @param {Function} fn - Async function to wrap (route handler)
 * @returns {Function} Express middleware function that handles promise rejections
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * @module types/express
 * @description Extended Express types for 2026GPTees
 * @since 2025-11-21
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
      };
    }
  }
}

export {};

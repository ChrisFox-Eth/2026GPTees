/**
 * @module types/design
 * @description Shared design type definitions used across the preview flow.
 * @since 2025-11-21
 */

import type { OrderStatus } from './order';

/**
 * @typedef {'GENERATING' | 'COMPLETED' | 'FAILED' | 'APPROVED'} DesignStatus
 * @description Status states for AI-generated t-shirt designs throughout the generation lifecycle
 */
export type DesignStatus = 'GENERATING' | 'COMPLETED' | 'FAILED' | 'APPROVED';

/**
 * @interface Design
 * @description Represents an AI-generated t-shirt design with metadata, status tracking, and associated order information
 *
 * @property {string} id - Unique identifier for the design
 * @property {string} [userId] - ID of the user who created the design (optional for guest designs)
 * @property {string | null} [orderId] - Associated order ID, null if design is not yet linked to an order (optional)
 * @property {string} prompt - Original user prompt/description used to generate the design
 * @property {string | null} [revisedPrompt] - AI-revised or enhanced version of the original prompt (optional)
 * @property {string} [aiModel] - Name/identifier of the AI model used to generate the design (optional)
 * @property {string} imageUrl - Full-resolution URL of the generated design image
 * @property {string | null} [thumbnailUrl] - Optimized thumbnail URL for preview display (optional)
 * @property {DesignStatus} status - Current status of the design generation process
 * @property {string | null} style - Selected art style/theme applied to the design (e.g., 'retro', 'minimalist')
 * @property {boolean} approvalStatus - Whether the design has been approved by the user for production
 * @property {string} [generatedAt] - ISO timestamp when the design generation completed (optional)
 * @property {string | null} [approvedAt] - ISO timestamp when the design was approved by the user (optional)
 * @property {string} createdAt - ISO timestamp when the design record was created
 * @property {string} [updatedAt] - ISO timestamp of the last update to the design record (optional)
 * @property {Object} [order] - Associated order information (optional)
 * @property {string} order.id - Order unique identifier
 * @property {OrderStatus} order.status - Current status of the order
 * @property {string} order.designTier - Pricing tier of the order (BASIC, PREMIUM, LIMITLESS)
 * @property {number | 'unlimited'} [remainingDesigns] - Number of design generations remaining for the user, or 'unlimited' for premium tiers (optional)
 */
export interface Design {
  id: string;
  userId?: string;
  orderId?: string | null;
  prompt: string;
  revisedPrompt?: string | null;
  aiModel?: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  status: DesignStatus;
  style: string | null;
  approvalStatus: boolean;
  generatedAt?: string;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  order?: {
    id: string;
    status: OrderStatus;
    designTier: string;
  };
  remainingDesigns?: number | 'unlimited';
}

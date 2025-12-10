/**
 * @module types/design
 * @description Shared design type definitions used across the preview flow.
 */

import type { OrderStatus } from './order';

export type DesignStatus = 'GENERATING' | 'COMPLETED' | 'FAILED' | 'APPROVED';

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

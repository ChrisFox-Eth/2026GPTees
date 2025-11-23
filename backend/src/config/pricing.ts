/**
 * @module config/pricing
 * @description Pricing tier configuration for 2026GPTees
 * @since 2025-11-21
 */

export enum TierType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  TEST = 'TEST',
}

export interface TierConfig {
  name: string;
  price: number;
  maxDesigns: number;
  description: string;
}

export const TIERS: Record<TierType, TierConfig> = {
  [TierType.BASIC]: {
    name: 'Basic',
    price: 0.50,
    maxDesigns: 1,
    description: 'Generate 1 AI design',
  },
  [TierType.PREMIUM]: {
    name: 'Premium',
    price: 34.99,
    maxDesigns: 9999,
    description: 'Unlimited AI design regeneration',
  },
  [TierType.TEST]: {
    name: 'Test',
    price: 0.01,
    maxDesigns: 1,
    description: 'Test tier for development',
  },
};

/**
 * Get tier configuration by type
 * @param {TierType} tier - Tier type
 * @returns {TierConfig} Tier configuration
 */
export function getTierConfig(tier: TierType): TierConfig {
  return TIERS[tier];
}

/**
 * Calculate total price including product base price
 * @param {number} basePrice - Product base price
 * @param {TierType} tier - Selected tier
 * @returns {number} Total price
 */
export function calculateTotalPrice(basePrice: number, tier: TierType): number {
  const tierConfig = getTierConfig(tier);
  return basePrice + tierConfig.price;
}

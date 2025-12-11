/**
 * @module config/pricing
 * @description Pricing tier configuration for 2026GPTees
 * @since 2025-11-21
 */

export enum TierType {
  LIMITLESS = 'PREMIUM',
}

export interface TierConfig {
  name: string;
  price: number;
  maxDesigns: number;
  description: string;
}

export const TIERS: Record<TierType, TierConfig> = {
  [TierType.LIMITLESS]: {
    name: 'Limitless',
    price: 54.99,
    maxDesigns: 9999,
    description: 'Unlimited GPTee design regeneration',
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

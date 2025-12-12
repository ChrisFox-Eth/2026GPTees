/**
 * @module config/pricing
 * @description Pricing tier configuration for 2026GPTees
 * @since 2025-11-21
 */

/**
 * @enum TierType
 * @description Pricing tier enumeration
 */
export enum TierType {
  LIMITLESS = 'PREMIUM',
}

/**
 * @interface TierConfig
 * @description Tier configuration schema
 * @property {string} name - Tier display name
 * @property {number} price - Tier price in USD
 * @property {number} maxDesigns - Maximum design generations (9999 = unlimited)
 * @property {string} description - Tier description
 */
export interface TierConfig {
  name: string;
  price: number;
  maxDesigns: number;
  description: string;
}

/**
 * @constant TIERS
 * @description Pricing tier configuration map
 */
export const TIERS: Record<TierType, TierConfig> = {
  [TierType.LIMITLESS]: {
    name: 'Limitless',
    price: 54.99,
    maxDesigns: 9999,
    description: 'Unlimited GPTee design regeneration',
  },
};

/**
 * @function getTierConfig
 * @description Retrieves tier configuration by type
 *
 * @param {TierType} tier - Tier type
 * @returns {TierConfig} Tier configuration object
 */
export function getTierConfig(tier: TierType): TierConfig {
  return TIERS[tier];
}

/**
 * @function calculateTotalPrice
 * @description Calculates total price including product base price and tier price
 *
 * @param {number} basePrice - Product base price
 * @param {TierType} tier - Selected tier
 * @returns {number} Total price in USD
 */
export function calculateTotalPrice(basePrice: number, tier: TierType): number {
  const tierConfig = getTierConfig(tier);
  return basePrice + tierConfig.price;
}

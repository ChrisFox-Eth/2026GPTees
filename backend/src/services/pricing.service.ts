/**
 * @module services/pricing
 * @description Dynamic pricing service sourced from database settings with fallback to static defaults. Enables runtime pricing adjustments without code deployment. Uses database as source of truth so operators can hotfix pricing and design limits without requiring code changes.
 * @since 2025-11-21
 */

import prisma from '../config/database.js';
import { TIERS, TierConfig, TierType } from '../config/pricing.js';

/**
 * Database setting keys for tier prices
 */
const PRICE_KEYS: Record<TierType, string> = {
  [TierType.LIMITLESS]: 'premium_tier_price',
};

/**
 * Database setting keys for max designs per tier
 */
const MAX_DESIGNS_KEYS: Record<TierType, string> = {
  [TierType.LIMITLESS]: 'premium_tier_max_designs',
};

/**
 * @function parseNumberSetting
 * @description Safely parses a numeric setting value from database string format. Returns null for invalid or missing values.
 *
 * @param {string | null | undefined} raw - Raw setting string from database
 *
 * @returns {number | null} Parsed number or null if invalid
 *
 * @example
 * const price = parseNumberSetting('29.99'); // 29.99
 * const invalid = parseNumberSetting('abc'); // null
 */
function parseNumberSetting(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * @function getTierPricingMap
 * @description Retrieves complete tier pricing configuration from database settings, with fallback to static defaults. Merges database values with code defaults to ensure configuration is always valid.
 *
 * @returns {Promise<Record<TierType, TierConfig>>} Complete tier configuration map
 * @returns {number} price - Price in dollars for the tier
 * @returns {number} maxDesigns - Maximum design generations allowed (999999 for unlimited)
 *
 * @example
 * const tiers = await getTierPricingMap();
 * const limitlessPrice = tiers.LIMITLESS.price; // 25.00 (or DB override)
 * const maxDesigns = tiers.LIMITLESS.maxDesigns; // 999999
 *
 * @async
 */
export async function getTierPricingMap(): Promise<Record<TierType, TierConfig>> {
  const settingKeys = [
    ...Object.values(PRICE_KEYS),
    ...Object.values(MAX_DESIGNS_KEYS),
  ];

  const settings = await prisma.settings.findMany({
    where: { key: { in: settingKeys } },
  });

  const settingsMap = new Map<string, string | null>(
    settings.map((s: any) => [s.key, s.value as string | null])
  );

  const merged: Record<TierType, TierConfig> = {
    [TierType.LIMITLESS]: { ...TIERS[TierType.LIMITLESS] },
  };

  Object.values(TierType).forEach((tier) => {
    const priceKey = PRICE_KEYS[tier];
    const maxDesignsKey = MAX_DESIGNS_KEYS[tier];
    const price = parseNumberSetting(settingsMap.get(priceKey) as string | null);
    const maxDesigns = parseNumberSetting(settingsMap.get(maxDesignsKey) as string | null);

    if (price !== null) {
      merged[tier].price = price;
    }
    if (maxDesigns !== null) {
      merged[tier].maxDesigns = maxDesigns;
    }
  });

  // Ensure Limitless remains unlimited unless explicitly overridden
  merged[TierType.LIMITLESS].maxDesigns = merged[TierType.LIMITLESS].maxDesigns || TIERS[TierType.LIMITLESS].maxDesigns;

  return merged;
}

/**
 * @function getTierPricing
 * @description Retrieves pricing configuration for a specific tier. Convenience wrapper around getTierPricingMap.
 *
 * @param {TierType} tier - Tier identifier (e.g., TierType.LIMITLESS)
 *
 * @returns {Promise<TierConfig>} Tier configuration including price and maxDesigns
 *
 * @example
 * const limitlessConfig = await getTierPricing(TierType.LIMITLESS);
 * console.log(limitlessConfig.price); // 25.00
 *
 * @async
 */
export async function getTierPricing(tier: TierType): Promise<TierConfig> {
  const map = await getTierPricingMap();
  return map[tier];
}

/**
 * @module services/pricing
 * @description Pricing lookup sourced from Supabase Settings with sane defaults.
 * Uses DB as source of truth so operators can hotfix pricing/max designs without code changes.
 */

import prisma from '../config/database.js';
import { TIERS, TierConfig, TierType } from '../config/pricing.js';

const PRICE_KEYS: Record<TierType, string> = {
  [TierType.BASIC]: 'basic_tier_price',
  [TierType.PREMIUM]: 'premium_tier_price',
  [TierType.TEST]: 'test_tier_price',
};

const MAX_DESIGNS_KEYS: Record<TierType, string> = {
  [TierType.BASIC]: 'basic_tier_max_designs',
  [TierType.PREMIUM]: 'premium_tier_max_designs',
  [TierType.TEST]: 'test_tier_max_designs',
};

/**
 * Parse a numeric setting value.
 * @param {string | null | undefined} raw - Raw setting string from the DB.
 * @returns {number | null} Parsed number or null if invalid.
 */
function parseNumberSetting(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Get tier pricing map from Supabase Settings, falling back to static defaults.
 * @returns {Promise<Record<TierType, TierConfig>>} Tier configuration keyed by tier.
 */
export async function getTierPricingMap(): Promise<Record<TierType, TierConfig>> {
  const settingKeys = [
    ...Object.values(PRICE_KEYS),
    ...Object.values(MAX_DESIGNS_KEYS),
  ];

  const settings = await prisma.settings.findMany({
    where: { key: { in: settingKeys } },
  });

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const merged: Record<TierType, TierConfig> = {
    [TierType.BASIC]: { ...TIERS[ TierType.BASIC ] },
    [TierType.PREMIUM]: { ...TIERS[ TierType.PREMIUM ] },
    [TierType.TEST]: { ...TIERS[ TierType.TEST ] },
  };

  Object.values(TierType).forEach((tier) => {
    const priceKey = PRICE_KEYS[tier];
    const maxDesignsKey = MAX_DESIGNS_KEYS[tier];
    const price = parseNumberSetting(settingsMap.get(priceKey));
    const maxDesigns = parseNumberSetting(settingsMap.get(maxDesignsKey));

    if (price !== null) {
      merged[tier].price = price;
    }
    if (maxDesigns !== null) {
      merged[tier].maxDesigns = maxDesigns;
    }
  });

  // Ensure Premium remains unlimited unless explicitly overridden
  merged[TierType.PREMIUM].maxDesigns = merged[TierType.PREMIUM].maxDesigns || TIERS[TierType.PREMIUM].maxDesigns;

  return merged;
}

/**
 * Get a single tier configuration.
 * @param {TierType} tier - Tier identifier.
 * @returns {Promise<TierConfig>} Tier configuration for the requested tier.
 */
export async function getTierPricing(tier: TierType): Promise<TierConfig> {
  const map = await getTierPricingMap();
  return map[tier];
}

/**
 * @module components/sections/PricingSection/types
 * @description Type definitions for PricingSection component
 * @since 2025-11-21
 */

/**
 * Pricing tier card configuration
 * @interface TierCard
 * @property {string} name - Internal tier name identifier
 * @property {string} displayName - Display name shown to users
 * @property {string} price - Formatted price string (e.g., "$54.99")
 * @property {string} description - Brief description of the tier
 * @property {string[]} features - List of features included in this tier
 * @property {string} cta - Call-to-action button text
 * @property {boolean} highlighted - Whether this tier should be visually emphasized
 * @property {string} [badge] - Optional badge text displayed above the tier card
 */
export interface TierCard {
  /** Internal tier name identifier */
  name: string;
  /** Display name shown to users */
  displayName: string;
  /** Formatted price string (e.g., "$54.99") */
  price: string;
  /** Brief description of the tier */
  description: string;
  /** List of features included in this tier */
  features: string[];
  /** Call-to-action button text */
  cta: string;
  /** Whether this tier should be visually emphasized */
  highlighted: boolean;
  /** Optional badge text displayed above the tier card */
  badge?: string;
}

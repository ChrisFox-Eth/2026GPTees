/**
 * @module types/promo
 * @description Promo and gift code related type definitions.
 * @since 2025-11-21
 */

/**
 * @typedef {'FREE_PRODUCT' | 'PERCENT_OFF'} PromoType
 * @description Types of promotional discounts available in the system
 */
export type PromoType = 'FREE_PRODUCT' | 'PERCENT_OFF';

/**
 * @typedef {'BASIC' | 'PREMIUM' | 'TEST' | 'LIMITLESS'} PromoTier
 * @description Product pricing tiers that can be applied via promotional codes
 */
export type PromoTier = 'BASIC' | 'PREMIUM' | 'TEST' | 'LIMITLESS';

/**
 * @interface AppliedCodeInfo
 * @description Information about a promotional code that has been applied to an order
 *
 * @property {string} code - The promotional code string entered by the user
 * @property {PromoType} type - Type of discount this code provides
 * @property {number | null} [percentOff] - Percentage discount amount (0-100) for PERCENT_OFF type codes (optional)
 * @property {string | null} [productTier] - Product tier granted for FREE_PRODUCT type codes (optional)
 */
export interface AppliedCodeInfo {
  code: string;
  type: PromoType;
  percentOff?: number | null;
  productTier?: string | null;
}

/**
 * @interface PromoCode
 * @description Full promotional code definition with usage tracking and configuration
 *
 * @property {string} id - Unique identifier for the promo code
 * @property {string} code - The actual promo code string users enter at checkout
 * @property {PromoType} type - Type of discount this promo code provides
 * @property {PromoTier | null} [productTier] - Product tier granted for FREE_PRODUCT codes (optional)
 * @property {number | null} [percentOff] - Percentage discount (0-100) for PERCENT_OFF codes (optional)
 * @property {number | null} [usageLimit] - Maximum number of times this code can be redeemed, null for unlimited (optional)
 * @property {number} usageCount - Current number of times this code has been used
 * @property {boolean} disabled - Whether the promo code is currently active or disabled
 * @property {string} createdAt - ISO timestamp when the promo code was created
 * @property {Object | null} [createdBy] - Information about the admin who created this code (optional)
 * @property {string | null} createdBy.email - Email address of the admin creator
 */
export interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  productTier?: PromoTier | null;
  percentOff?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  disabled: boolean;
  createdAt: string;
  createdBy?: { email: string | null } | null;
}

/**
 * @interface PromoOrderSummary
 * @description Condensed order information for displaying promo code redemption history
 *
 * @property {string} id - Unique order identifier
 * @property {string} orderNumber - Human-readable order reference number
 * @property {number} totalAmount - Total order amount in cents
 * @property {string | null} [paidAt] - ISO timestamp when payment was completed, null if unpaid (optional)
 */
export interface PromoOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAt?: string | null;
}

/**
 * @interface PromoDetail
 * @description Detailed promotional code view with associated order history
 *
 * @property {PromoCode} promo - The promotional code details
 * @property {PromoOrderSummary[]} recentOrders - Array of recent orders that used this promo code
 */
export interface PromoDetail {
  promo: PromoCode;
  recentOrders: PromoOrderSummary[];
}

/**
 * @interface MetricsSeriesPoint
 * @description Single data point in a time-series metrics chart for promo code performance
 *
 * @property {string} bucket - Time bucket label (e.g., date, week, or month identifier)
 * @property {number} redemptions - Number of promo code redemptions in this time bucket
 * @property {number} revenue - Total revenue generated in this time bucket (in cents)
 */
export interface MetricsSeriesPoint {
  bucket: string;
  redemptions: number;
  revenue: number;
}

/**
 * @interface MetricsResponse
 * @description Aggregated promotional code analytics with totals and time-series data
 *
 * @property {Object} totals - Aggregate metrics across all promo codes
 * @property {number} totals.redemptions - Total number of promo code redemptions
 * @property {number} totals.revenue - Total revenue generated from promo code orders (in cents)
 * @property {number} totals.activeCodes - Number of currently active promo codes
 * @property {number | null} [totals.remaining] - Total remaining redemptions across all codes with limits (optional)
 * @property {MetricsSeriesPoint[]} series - Time-series data points for charting performance over time
 */
export interface MetricsResponse {
  totals: {
    redemptions: number;
    revenue: number;
    activeCodes: number;
    remaining?: number | null;
  };
  series: MetricsSeriesPoint[];
}

/**
 * @interface CreatePromoFormState
 * @description Form state for creating or editing promotional codes in the admin interface
 *
 * @property {string} code - The promo code string to create
 * @property {PromoType} type - Type of discount this code will provide
 * @property {PromoTier} productTier - Product tier for FREE_PRODUCT codes
 * @property {number} percentOff - Percentage discount (0-100) for PERCENT_OFF codes
 * @property {number | null} usageLimit - Maximum redemptions allowed, null for unlimited
 * @property {boolean} disabled - Whether the code should be created in disabled state
 */
export interface CreatePromoFormState {
  code: string;
  type: PromoType;
  productTier: PromoTier;
  percentOff: number;
  usageLimit: number | null;
  disabled: boolean;
}

/**
 * @typedef {'PREMIUM'} GiftTierOption
 * @description Available product tier options for gift code generation
 */
export type GiftTierOption = 'PREMIUM';

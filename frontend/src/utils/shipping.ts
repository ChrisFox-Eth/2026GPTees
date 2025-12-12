/**
 * @module utils/shipping
 * @description Frontend shipping calculator using flat-rate tiers by destination.
 * Rates are kept in sync with backend pricing. Used for checkout estimates.
 * @since 2025-11-21
 */

/**
 * @interface ShippingAddress
 * @description Minimal address structure needed for shipping calculation
 *
 * @property {string} [country] - Country code or name (defaults to 'US' if not provided)
 */
export interface ShippingAddress {
  country?: string;
}

/**
 * @constant {number} DEFAULT_SHIPPING
 * @description Flat-rate shipping cost for US destinations in USD
 * @private
 */
const DEFAULT_SHIPPING = 5.95;

/**
 * @constant {number} CANADA_SHIPPING
 * @description Flat-rate shipping cost for Canadian destinations in USD
 * @private
 */
const CANADA_SHIPPING = 7.95;

/**
 * @constant {number} INTERNATIONAL_SHIPPING
 * @description Flat-rate shipping cost for all other international destinations in USD
 * @private
 */
const INTERNATIONAL_SHIPPING = 9.95;

/**
 * @function calculateShipping
 * @description Calculates flat-rate shipping based on destination country.
 * Supports country codes (US, CA) and full names (United States, Canada).
 *
 * @param {ShippingAddress} address - Destination address with optional country
 * @returns {number} Shipping cost in USD (5.95 US, 7.95 Canada, 9.95 international)
 *
 * @example
 * calculateShipping({ country: 'US' }) // => 5.95
 * calculateShipping({ country: 'CA' }) // => 7.95
 * calculateShipping({ country: 'UK' }) // => 9.95
 * calculateShipping({}) // => 5.95 (defaults to US)
 */
export function calculateShipping(address: ShippingAddress): number {
  const country = (address.country || 'US').toUpperCase();
  if (country === 'US' || country === 'USA' || country === 'UNITED STATES') {
    return DEFAULT_SHIPPING;
  }
  if (country === 'CA' || country === 'CANADA') {
    return CANADA_SHIPPING;
  }
  return INTERNATIONAL_SHIPPING;
}

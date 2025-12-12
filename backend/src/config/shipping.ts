/**
 * @module config/shipping
 * @description Flat-rate shipping configuration and calculator
 * @since 2025-11-21
 */

/**
 * @interface ShippingAddressInput
 * @description Shipping address input for rate calculation
 * @property {string} country - Country code (e.g., US, CA)
 * @property {string} state - State/province code (optional)
 */
export interface ShippingAddressInput {
  country?: string;
  state?: string;
}

/**
 * @constant DEFAULT_SHIPPING
 * @description Flat shipping rate for US orders (in USD)
 */
const DEFAULT_SHIPPING = 5.95;

/**
 * @constant INTERNATIONAL_SHIPPING
 * @description Flat shipping rate for international orders (in USD)
 */
const INTERNATIONAL_SHIPPING = 9.95;

/**
 * @constant CANADA_SHIPPING
 * @description Flat shipping rate for Canadian orders (in USD)
 */
const CANADA_SHIPPING = 7.95;

/**
 * @function calculateShipping
 * @description Calculates flat shipping rate based on destination country
 *
 * @param {ShippingAddressInput} address - Destination address
 * @returns {number} Shipping cost in USD (5.95 US, 7.95 CA, 9.95 international)
 */
export function calculateShipping(address: ShippingAddressInput): number {
  const country = (address.country || 'US').toUpperCase();
  if (country === 'US' || country === 'USA' || country === 'UNITED STATES') {
    return DEFAULT_SHIPPING;
  }
  if (country === 'CA' || country === 'CANADA') {
    return CANADA_SHIPPING;
  }
  return INTERNATIONAL_SHIPPING;
}

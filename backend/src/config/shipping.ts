/**
 * @module config/shipping
 * @description Flat-rate shipping configuration and calculator.
 */

export interface ShippingAddressInput {
  country?: string;
  state?: string;
}

const DEFAULT_SHIPPING = 5.95;
const INTERNATIONAL_SHIPPING = 9.95;
const CANADA_SHIPPING = 7.95;

/**
 * Calculate a flat shipping rate based on country.
 * @param {ShippingAddressInput} address - Destination address.
 * @returns {number} Shipping cost in USD.
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

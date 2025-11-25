/**
 * @module utils/shipping
 * @description Frontend shipping calculator (kept in sync with backend flat rates).
 */

export interface ShippingAddress {
  country?: string;
}

const DEFAULT_SHIPPING = 5.95;
const CANADA_SHIPPING = 7.95;
const INTERNATIONAL_SHIPPING = 9.95;

/**
 * Calculate flat-rate shipping by country.
 * @param {ShippingAddress} address - Destination address (country code or name).
 * @returns {number} Shipping amount in USD.
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

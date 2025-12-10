/**
 * @module types/promo
 * @description Promo and gift code related type definitions.
 */

export interface AppliedCodeInfo {
  code: string;
  type: 'FREE_PRODUCT' | 'PERCENT_OFF';
  percentOff?: number | null;
  productTier?: string | null;
}

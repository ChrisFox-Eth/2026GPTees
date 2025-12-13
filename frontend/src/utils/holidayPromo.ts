/**
 * @module utils/holidayPromo
 * @description Central configuration for the time-limited HAPPYHOLIDAYS promotion.
 * @since 2025-12-13
 */

export const HAPPY_HOLIDAYS_CODE = 'HAPPYHOLIDAYS';
export const HAPPY_HOLIDAYS_PERCENT_OFF = 20;

// Dec 31, 11:59 PM (America/New_York) => Jan 1, 04:59 UTC.
export const HAPPY_HOLIDAYS_ENDS_AT = new Date('2026-01-01T04:59:59.000Z');

export const HAPPY_HOLIDAYS_BANNER_DISMISSED_KEY = 'gptees_happyholidays_banner_dismissed_v1';
export const HAPPY_HOLIDAYS_CHECKOUT_OPT_OUT_KEY = 'gptees_happyholidays_checkout_opt_out_v1';

export function isHappyHolidaysActive(now: Date = new Date()): boolean {
  return now.getTime() <= HAPPY_HOLIDAYS_ENDS_AT.getTime();
}

export function formatHappyHolidaysEndsShort(): string {
  return 'Dec 31';
}

export function parseUsdAmount(priceText: string): number | null {
  const cleaned = priceText.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatUsdAmount(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function applyPercentOff(value: number, percentOff: number): number {
  const percent = Math.min(Math.max(percentOff, 0), 100);
  const factor = (100 - percent) / 100;
  return Math.round(value * factor * 100) / 100;
}


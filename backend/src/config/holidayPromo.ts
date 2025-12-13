/**
 * @module config/holidayPromo
 * @description Central configuration for the time-limited HAPPYHOLIDAYS promotion.
 * @since 2025-12-13
 */

export const HAPPY_HOLIDAYS_CODE = 'HAPPYHOLIDAYS';
export const HAPPY_HOLIDAYS_PERCENT_OFF = 20;

// Dec 31, 11:59 PM (America/New_York) => Jan 1, 04:59 UTC.
export const HAPPY_HOLIDAYS_ENDS_AT = new Date('2026-01-01T04:59:59.000Z');

export function normalizePromoCode(raw: string | undefined | null): string {
  return String(raw || '').trim().toUpperCase();
}

export function isHappyHolidaysActive(now: Date = new Date()): boolean {
  return now.getTime() <= HAPPY_HOLIDAYS_ENDS_AT.getTime();
}


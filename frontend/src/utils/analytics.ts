/**
 * @module utils/analytics
 * @description Lightweight Vercel Analytics helpers for page and event tracking.
 */

import { inject, track } from '@vercel/analytics';

type Primitive = string | number | boolean | null;
type AnalyticsPayload = Record<string, Primitive>;

const isClient = typeof window !== 'undefined';
let hasInjected = false;

/**
 * Initialize Vercel Analytics once on the client.
 */
export function initAnalytics(): void {
  if (!isClient || hasInjected) return;
  try {
    inject({ mode: import.meta.env.DEV ? 'development' : 'production' });
    hasInjected = true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Analytics injection failed', error);
    }
  }
}

const sanitizePayload = (payload?: Record<string, unknown>): AnalyticsPayload => {
  if (!payload) return {};

  return Object.entries(payload).reduce<AnalyticsPayload>((acc, [key, value]) => {
    if (value === undefined) return acc;

    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const sanitizedValue =
        typeof value === 'string' && value.length > 255 ? value.slice(0, 255) : value;
      acc[key] = sanitizedValue as Primitive;
    }

    return acc;
  }, {});
};

/**
 * Track a custom event with safe, flat payloads.
 */
export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (!isClient) return;

  try {
    track(eventName, sanitizePayload(payload));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`Analytics event failed: ${eventName}`, error);
    }
  }
}

/**
 * Track a page view with route details.
 */
export function trackPageView(details: {
  path: string;
  search?: string | null;
  title?: string;
  referrer?: string;
}): void {
  trackEvent('site.page_view', {
    path: details.path,
    search: details.search || null,
    title_length: details.title ? details.title.length : null,
    referrer: details.referrer || null,
  });
}

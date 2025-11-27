/**
 * @module utils/analytics
 * @description Vercel Analytics helpers for page and event tracking.
 */

import { inject, track } from '@vercel/analytics';
// import { loadMetaPixel, loadGA4 } from './pixels';

type Primitive = string | number | boolean | null;
type AnalyticsPayload = Record<string, Primitive>;

const isClient = typeof window !== 'undefined';
let injected = false;

/**
 * Initialize Vercel Analytics once on the client.
 */
export function initAnalytics(): void {
  if (!isClient || injected) return;

  try {
    inject({ mode: import.meta.env.DEV ? 'development' : 'production' });
    injected = true;
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
 * Track a custom event with a safe, flat payload.
 */
export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (!isClient) return;

  try {
    const clean = sanitizePayload(payload);
    track(eventName, clean);

    const fbq = (window as any).fbq;
    if (fbq) {
      fbq('trackCustom', eventName, clean);
    }
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, clean);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`Analytics event failed: ${eventName}`, error);
    }
  }
}

/**
 * Track a page view when the router path changes.
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

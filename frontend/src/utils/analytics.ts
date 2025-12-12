/**
 * @module utils/analytics
 * @description Analytics utilities for tracking user events and page views.
 * Integrates with Vercel Analytics, Meta Pixel (Facebook), and Google Analytics 4.
 * All tracking functions are no-ops on the server side.
 * @since 2025-11-21
 */

import { inject, track } from '@vercel/analytics';
// import { loadMetaPixel, loadGA4 } from './pixels';
import type { AnalyticsEventName } from '../types/analytics-event-catalog';

/**
 * @typedef {string | number | boolean | null} Primitive
 * @description Valid primitive types for analytics payload values
 */
type Primitive = string | number | boolean | null;

/**
 * @typedef {Record<string, Primitive>} AnalyticsPayload
 * @description Flat object with primitive values for analytics events
 */
type AnalyticsPayload = Record<string, Primitive>;

/**
 * @constant {boolean} isClient
 * @description Whether code is running in browser environment
 * @private
 */
const isClient = typeof window !== 'undefined';

/**
 * @var {boolean} injected
 * @description Flag to prevent duplicate Vercel Analytics injection
 * @private
 */
let injected = false;

/**
 * @function initAnalytics
 * @description Initializes Vercel Analytics on the client. Safe to call multiple times;
 * subsequent calls are no-ops. Runs in development or production mode based on environment.
 *
 * @returns {void}
 *
 * @example
 * // Call once at app startup (e.g., in main.tsx)
 * initAnalytics();
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

/**
 * @function sanitizePayload
 * @description Cleans and validates payload for analytics events. Removes undefined values,
 * truncates strings longer than 255 characters, and filters out non-primitive values.
 *
 * @param {Record<string, unknown>} [payload] - Raw payload object
 * @returns {AnalyticsPayload} Sanitized payload with only primitive values
 * @private
 */
const sanitizePayload = (payload?: Record<string, unknown>): AnalyticsPayload => {
  if (!payload) return {};

  return Object.entries(payload).reduce<AnalyticsPayload>((acc, [key, value]) => {
    if (value === undefined) return acc;

    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      const sanitizedValue =
        typeof value === 'string' && value.length > 255 ? value.slice(0, 255) : value;
      acc[key] = sanitizedValue as Primitive;
    }

    return acc;
  }, {});
};

/**
 * @function trackEvent
 * @description Tracks a custom analytics event across all configured platforms
 * (Vercel Analytics, Meta Pixel, Google Analytics 4). Payload is sanitized before sending.
 *
 * @param {string} eventName - Event name in dot notation (e.g., 'cart.item.add')
 * @param {Record<string, unknown>} [payload] - Event data (will be sanitized)
 * @returns {void}
 *
 * @example
 * trackEvent('cart.item.add', {
 *   product_id: 'tee-001',
 *   quantity: 1,
 *   tier: 'premium'
 * });
 *
 * @example
 * trackEvent('design.approval.submit', {
 *   order_id: orderId,
 *   design_id: designId,
 *   surface: 'order_detail'
 * });
 */
export function trackEvent(eventName: AnalyticsEventName, payload?: Record<string, unknown>): void {
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
 * @function trackPageView
 * @description Tracks a page view event when the router path changes.
 * Called automatically by PageViewTracker component in App.tsx.
 *
 * @param {Object} details - Page view details
 * @param {string} details.path - Current pathname (e.g., '/shop')
 * @param {string | null} [details.search] - Query string if present
 * @param {string} [details.title] - Document title
 * @param {string} [details.referrer] - Referring URL
 * @returns {void}
 *
 * @example
 * trackPageView({
 *   path: location.pathname,
 *   search: location.search,
 *   title: document.title,
 *   referrer: document.referrer
 * });
 *
 * @fires site.page_view
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

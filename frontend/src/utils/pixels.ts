/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module utils/pixels
 * @description Lightweight script loaders for third-party analytics pixels.
 * Provides functions to dynamically load Meta (Facebook) Pixel and Google Analytics 4.
 * All loaders are no-ops on the server side and prevent duplicate loading.
 * @since 2025-11-21
 */

/**
 * @constant {boolean} isClient
 * @description Whether code is running in browser environment
 * @private
 */
const isClient = typeof window !== 'undefined';

/**
 * @function loadMetaPixel
 * @description Loads the Meta (Facebook) Pixel tracking script. Safe to call multiple times;
 * subsequent calls are no-ops if already loaded. Initializes the pixel with the provided ID.
 *
 * @param {string} [pixelId] - Meta Pixel ID (e.g., '123456789'). If not provided, function is no-op.
 * @returns {void}
 *
 * @example
 * // Load pixel at app startup
 * loadMetaPixel(import.meta.env.VITE_META_PIXEL_ID);
 *
 * @see {@link https://developers.facebook.com/docs/meta-pixel/} Meta Pixel documentation
 */
export function loadMetaPixel(pixelId?: string): void {
  if (!isClient || !pixelId) return;
  if ((window as any).fbq) return;

  // Meta Pixel bootstrap
  (function (f: any, b) {
    if ((f as any).fbq) return;
    const n: any = ((f as any).fbq = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    });
    if (!(f as any)._fbq) (f as any)._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const s = b.getElementsByTagName('script')[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document);

  (window as any).fbq('init', pixelId);
}

/**
 * @function loadGA4
 * @description Loads Google Analytics 4 (GA4) tracking script. Safe to call multiple times;
 * subsequent calls are no-ops if already loaded. Configures gtag with the provided measurement ID.
 *
 * @param {string} [measurementId] - GA4 Measurement ID (e.g., 'G-XXXXXXXXXX'). If not provided, function is no-op.
 * @returns {void}
 *
 * @example
 * // Load GA4 at app startup
 * loadGA4(import.meta.env.VITE_GA4_ID);
 *
 * @see {@link https://developers.google.com/analytics/devguides/collection/ga4} GA4 documentation
 */
export function loadGA4(measurementId?: string): void {
  if (!isClient || !measurementId) return;
  if ((window as any).dataLayer && (window as any).gtag) return;

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

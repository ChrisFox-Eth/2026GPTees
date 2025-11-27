/**
 * @module utils/pixels
 * @description Lightweight loaders for Meta Pixel and GA4.
 */

const isClient = typeof window !== 'undefined';

export function loadMetaPixel(pixelId?: string): void {
  if (!isClient || !pixelId) return;
  if ((window as any).fbq) return;

  // Meta Pixel bootstrap
  (function (f: any, b) {
    if ((f as any).fbq) return;
    const n: any = (f as any).fbq = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    };
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

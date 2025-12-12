/**
 * @module components/sections/StickyCtaBar
 * @description Mobile-optimized sticky CTA bar for quick shop access and conversions
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a fixed bottom bar with primary label, subcopy, and "Shop now" button.
 * Supports both anchor links (smooth scroll) and URL navigation. Currently hidden via CSS.
 * Designed for mobile viewports to maintain CTA visibility while scrolling.
 *
 * @param {StickyCtaBarProps} props - Component props
 * @param {string} props.primaryLabel - Main heading text displayed in the bar
 * @param {string} props.subcopy - Supporting text shown above the primary label
 * @param {string} props.href - Link target (hash for smooth scroll, URL for navigation)
 *
 * @returns {JSX.Element} Fixed bottom bar with CTA content and action button
 *
 * @example
 * <StickyCtaBar
 *   primaryLabel="Start designing"
 *   subcopy="Limitless creativity"
 *   href="#quickstart"
 * />
 */

import { Button } from '@components/ui/Button';
import type { StickyCtaBarProps } from './StickyCtaBar.types';

export function StickyCtaBar({ primaryLabel, subcopy, href }: StickyCtaBarProps): JSX.Element {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur">
      <div className="container-max flex max-w-full items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs text-gray-500">{subcopy}</p>
          <p className="text-sm font-semibold text-gray-900">{primaryLabel}</p>
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 px-3 py-2 text-sm"
          onClick={() => {
            if (href.startsWith('#')) {
              const el = document.querySelector(href);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.assign(href);
            }
          }}
        >
          Shop now
        </Button>
      </div>
    </div>
  );
}

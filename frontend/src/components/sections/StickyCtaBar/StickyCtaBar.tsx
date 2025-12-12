/**
 * @module components/sections/StickyCtaBar
 * @description Mobile-optimized sticky CTA bar for quick shop access and conversions
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a fixed bottom bar with primary label, subcopy, and action button.
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
 *   subcopy="Studio access included"
 *   href="#quickstart"
 * />
 */

import { Button } from '@components/ui/Button';
import type { StickyCtaBarProps } from './StickyCtaBar.types';

export function StickyCtaBar({ primaryLabel, subcopy, href }: StickyCtaBarProps): JSX.Element {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-muted/20 bg-surface/95 shadow-lifted backdrop-blur dark:border-muted-dark/20 dark:bg-surface-dark/95">
      <div className="container-max flex max-w-full items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-sans text-xs text-muted dark:text-muted-dark">{subcopy}</p>
          <p className="font-sans text-sm font-semibold text-ink dark:text-ink-dark">{primaryLabel}</p>
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 bg-accent px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-accent-dark"
          onClick={() => {
            if (href.startsWith('#')) {
              const el = document.querySelector(href);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.assign(href);
            }
          }}
        >
          Start now
        </Button>
      </div>
    </div>
  );
}

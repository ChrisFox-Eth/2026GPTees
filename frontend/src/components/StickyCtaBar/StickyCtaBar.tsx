/**
 * @module components/StickyCtaBar
 * @description Mobile-only sticky CTA bar for quick shop access.
 */

import { Button } from '@components/Button';

interface StickyCtaBarProps {
  primaryLabel: string;
  subcopy: string;
  href: string;
}

export function StickyCtaBar({ primaryLabel, subcopy, href }: StickyCtaBarProps): JSX.Element {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
      <div className="container-max max-w-full px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{subcopy}</p>
          <p className="text-sm font-semibold text-gray-900">{primaryLabel}</p>
        </div>
        <Button
          size="sm"
          className="px-3 py-2 text-sm flex-shrink-0"
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

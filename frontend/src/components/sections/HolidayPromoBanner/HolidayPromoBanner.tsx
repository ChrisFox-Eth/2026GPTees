/**
 * @module components/sections/HolidayPromoBanner
 * @description Dismissible, time-limited holiday promo banner.
 * @since 2025-12-13
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackEvent } from '@utils/analytics';
import {
  HAPPY_HOLIDAYS_BANNER_DISMISSED_KEY,
  HAPPY_HOLIDAYS_CODE,
  HAPPY_HOLIDAYS_PERCENT_OFF,
  formatHappyHolidaysEndsShort,
  isHappyHolidaysActive,
} from '@utils/holidayPromo';

function isHiddenRoute(pathname: string): boolean {
  return pathname.startsWith('/gift') || pathname.startsWith('/auth') || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
}

export default function HolidayPromoBanner(): JSX.Element | null {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(HAPPY_HOLIDAYS_BANNER_DISMISSED_KEY) === '1';
  });
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    if (dismissed) return false;
    if (!isHappyHolidaysActive()) return false;
    if (isHiddenRoute(pathname)) return false;
    return true;
  }, [dismissed, pathname]);

  useEffect(() => {
    if (!visible) return;
    trackEvent('promo.happyholidays.banner.view', { surface: 'global' });
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(HAPPY_HOLIDAYS_BANNER_DISMISSED_KEY, '1');
    trackEvent('promo.happyholidays.banner.dismiss', { surface: 'global' });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(HAPPY_HOLIDAYS_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore (clipboard may be unavailable depending on browser context)
    } finally {
      trackEvent('promo.happyholidays.banner.copy', { surface: 'global' });
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-muted/20 bg-surface/95 shadow-lifted backdrop-blur dark:border-muted-dark/20 dark:bg-surface-dark/95">
      <div className="container-max flex items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <p className="truncate font-sans text-xs font-semibold text-ink dark:text-ink-dark">
            Holiday sale: {HAPPY_HOLIDAYS_PERCENT_OFF}% off with code{' '}
            <span className="font-mono">{HAPPY_HOLIDAYS_CODE}</span>
          </p>
          <p className="truncate font-sans text-[11px] text-muted dark:text-muted-dark">
            Ends {formatHappyHolidaysEndsShort()}. Excludes gift cards.{' '}
            <Link to="/gift" className="text-accent hover:underline dark:text-accent-dark">
              Gift cards available
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-muted/30 bg-surface px-3 py-1.5 font-sans text-xs font-semibold text-ink shadow-soft transition-colors hover:bg-surface-2 dark:border-muted-dark/30 dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-surface-dark/60"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss promo"
            className="rounded-md px-2 py-1.5 text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}


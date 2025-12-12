/**
 * @module components/sections/StickyCtaBar/types
 * @description Type definitions for StickyCtaBar component
 * @since 2025-11-21
 */

/**
 * Props for the StickyCtaBar component
 * @interface StickyCtaBarProps
 * @property {string} primaryLabel - Main heading text displayed in the bar
 * @property {string} subcopy - Supporting text shown above the primary label
 * @property {string} href - Link target (hash for smooth scroll, URL for navigation)
 */
export interface StickyCtaBarProps {
  /** Main heading text displayed in the bar */
  primaryLabel: string;
  /** Supporting text shown above the primary label */
  subcopy: string;
  /** Link target (hash for smooth scroll, URL for navigation) */
  href: string;
}

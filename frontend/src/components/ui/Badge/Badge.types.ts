/**
 * @module components/ui/Badge
 * @description Type definitions for the Badge component
 * @since 2025-11-21
 */

/**
 * Badge variant styles
 * @typedef {('primary' | 'secondary' | 'success' | 'warning' | 'danger')} BadgeVariant
 */
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Badge size variants
 * @typedef {('sm' | 'md' | 'lg')} BadgeSize
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Badge component
 * @interface BadgeProps
 * @extends {React.HTMLAttributes<HTMLSpanElement>}
 *
 * @property {React.ReactNode} children - Content to display in the badge
 * @property {BadgeVariant} [variant='primary'] - Badge color variant
 * @property {BadgeSize} [size='md'] - Badge size preset
 * @property {boolean} [isDismissible=false] - Whether badge can be dismissed
 * @property {() => void} [onDismiss] - Callback when badge is dismissed
 * @property {boolean} [isRounded=true] - Whether badge has fully rounded corners
 * @property {string} [className] - Additional CSS classes
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  isDismissible?: boolean;
  onDismiss?: () => void;
  isRounded?: boolean;
  className?: string;
}

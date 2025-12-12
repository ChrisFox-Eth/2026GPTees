/**
 * @module components/ui/Badge
 * @description A small badge/tag component for labeling and categorizing content
 * @since 2025-11-21
 */

/**
 * @component
 * @description A lightweight badge component for status indicators, tags, and labels.
 * Supports multiple variants, sizes, and optional dismiss functionality.
 *
 * @param {BadgeProps} props - Component props
 * @param {React.ReactNode} props.children - Content to display in the badge
 * @param {BadgeVariant} [props.variant='primary'] - Color variant (primary, secondary, success, warning, danger)
 * @param {BadgeSize} [props.size='md'] - Size preset (sm, md, lg)
 * @param {boolean} [props.isDismissible=false] - Whether badge can be dismissed
 * @param {() => void} [props.onDismiss] - Callback when badge is dismissed
 * @param {boolean} [props.isRounded=true] - Whether badge has fully rounded corners
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} A styled badge element
 *
 * @example
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * <Badge isDismissible onDismiss={() => removeTag()}>JavaScript</Badge>
 *
 * @see {@link BadgeProps} for prop definitions
 */

import { BadgeProps } from './Badge.types';

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  isDismissible = false,
  onDismiss,
  isRounded = true,
  className = '',
  ...rest
}: BadgeProps): JSX.Element {
  /**
   * Get base badge classes
   */
  const baseClasses = `inline-flex items-center gap-1 font-medium transition-colors ${
    isRounded ? 'rounded-full' : 'rounded'
  } dark:text-white`;

  /**
   * Get size-specific classes
   * @returns {string} Size classes
   */
  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-1.5 text-base';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  /**
   * Get variant-specific classes
   * @returns {string} Variant classes
   */
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200';
      case 'success':
        return 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200';
      case 'warning':
        return 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-200';
      case 'danger':
        return 'bg-danger-100 dark:bg-danger-900 text-danger-800 dark:text-danger-200';
      case 'primary':
      default:
        return 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200';
    }
  };

  return (
    <span
      className={`${baseClasses} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      {...rest}
    >
      {children}
      {isDismissible && (
        <button
          onClick={onDismiss}
          className="ml-1 inline-flex cursor-pointer items-center justify-center rounded-full hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label="Dismiss"
          type="button"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

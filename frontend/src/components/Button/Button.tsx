/**
 * @module components/Button/Button
 * @description A reusable button component with multiple variants and sizes.
 * Provides a flexible, accessible button component with support for different styles,
 * sizes, and states (loading, disabled).
 *
 * @component
 * @param {ButtonProps} props - {@link Button.types.ts|ButtonProps} for the button
 * @returns {JSX.Element} A styled button element
 *
 * @example
 * // Primary button with click handler
 * <Button onClick={() => console.log('Clicked!')}>Click Me</Button>
 *
 * @example
 * // Secondary button, large size, disabled
 * <Button variant="secondary" size="lg" isDisabled>
 *   Disabled Button
 * </Button>
 *
 * @example
 * // Danger button with loading state
 * <Button variant="danger" isLoading>
 *   Deleting...
 * </Button>
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @features
 * - Multiple color variants (primary, secondary, danger, success, warning)
 * - Three size options (sm, md, lg)
 * - Loading state with visual feedback
 * - Disabled state with opacity reduction
 * - Full keyboard accessibility
 * - ARIA labels for screen readers
 * - Dark mode support
 *
 * @accessibility
 * - Supports keyboard navigation and focus management
 * - ARIA labels can be provided via ariaLabel prop
 * - Disabled state is properly communicated to assistive technologies
 * - Sufficient color contrast in both light and dark modes
 *
 * @integration
 * Import and use within React components for consistent button styling
 * across the application.
 *
 * @status Active
 * @category UI Components
 */

import { ButtonProps } from './Button.types';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  className = '',
  onClick,
  type = 'button',
  ariaLabel,
  ...rest
}: ButtonProps): JSX.Element {
  /**
   * Get base button classes common to all buttons
   */
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  /**
   * Get size-specific classes
   * @returns {string} Size classes
   */
  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'md':
      default:
        return 'px-4 py-2 text-base';
    }
  };

  /**
   * Get variant-specific classes
   * @returns {string} Variant classes
   */
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:outline-secondary-500 dark:bg-secondary-700 dark:hover:bg-secondary-600';
      case 'danger':
        return 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:outline-danger-500 dark:bg-danger-700 dark:hover:bg-danger-600';
      case 'success':
        return 'bg-success-600 text-white hover:bg-success-700 focus-visible:outline-success-500 dark:bg-success-700 dark:hover:bg-success-600';
      case 'warning':
        return 'bg-warning-600 text-white hover:bg-warning-700 focus-visible:outline-warning-500 dark:bg-warning-700 dark:hover:bg-warning-600';
      case 'primary':
      default:
        return 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600';
    }
  };

  /**
   * Handle button click with loading state check
   */
  const handleClick = () => {
    if (!isLoading && !isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={`${baseClasses} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      aria-label={ariaLabel}
      aria-disabled={isDisabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

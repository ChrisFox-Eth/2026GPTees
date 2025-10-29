/**
 * @module components/Alert/Alert
 * @description A banner alert component for showing contextual messages (success, error, info, etc.).
 * Can be optionally dismissible by the user.
 *
 * @component
 * @param {AlertProps} props - {@link Alert.types.ts|AlertProps} for the alert
 * @returns {JSX.Element} A styled alert box with message content (and close button if dismissible)
 *
 * @example
 * // Simple info alert
 * <Alert variant="primary">This is an informational alert.</Alert>
 *
 * @example
 * // Success alert with dismiss option
 * <Alert variant="success" isDismissible onDismiss={() => setShow(false)}>
 *   Your changes have been saved successfully!
 * </Alert>
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Five contextual variants (primary, secondary, success, warning, danger) for different message types
 * - Dismissible option with an "X" button to close the alert
 * - Automatically uses theme palette colors for background, text, and border
 * - Responsive design (full width by default, content wraps as needed)
 * - Dark mode support for all variants (dark backgrounds and light text)
 *
 * @accessibility
 * - Uses a <div role="alert"> to ensure screen readers announce it immediately
 * - Dismiss button has aria-label "Close" for accessibility
 * - Maintains good contrast for text against background in both light and dark themes
 *
 * @integration
 * Use for flash messages, form validation feedback, or any inline notifications. For persistent banners, you can render an Alert at the top of relevant sections or pages.
 */

import { AlertProps } from './Alert.types';

export default function Alert({
  children,
  variant = 'primary',
  isDismissible = false,
  onDismiss,
  className = '',
  ...rest
}: AlertProps): JSX.Element {
  /**
   * Base alert classes for layout and spacing
   */
  const baseClasses = 'p-4 rounded-md flex items-start justify-between';

  /**
   * Determine variant-specific color classes for background, text, and border
   */
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary-50 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 border border-secondary-200 dark:border-secondary-800';
      case 'success':
        return 'bg-success-50 dark:bg-success-900 text-success-800 dark:text-success-200 border border-success-200 dark:border-success-800';
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-900 text-warning-800 dark:text-warning-200 border border-warning-200 dark:border-warning-800';
      case 'danger':
        return 'bg-danger-50 dark:bg-danger-900 text-danger-800 dark:text-danger-200 border border-danger-200 dark:border-danger-800';
      case 'primary':
      default:
        return 'bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border border-primary-200 dark:border-primary-800';
    }
  };

  return (
    <div className={`${baseClasses} ${getVariantClasses()} ${className}`} role="alert" {...rest}>
      {/* Alert message content */}
      <div className="pr-2 flex-1">{children}</div>
      {/* Dismiss/close button */}
      {isDismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

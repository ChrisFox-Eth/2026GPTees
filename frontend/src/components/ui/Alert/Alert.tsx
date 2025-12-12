/**
 * @module components/ui/Alert
 * @description A banner alert component for showing contextual messages (success, error, info, etc.)
 * @since 2025-11-21
 */

/**
 * @component
 * @description A banner alert component for displaying contextual messages with optional dismiss functionality.
 * Supports five visual variants corresponding to theme colors and includes dark mode support.
 *
 * @param {AlertProps} props - Component props
 * @param {React.ReactNode} props.children - Message or content to display inside the alert
 * @param {AlertVariant} [props.variant='primary'] - Color style variant (primary, secondary, success, warning, danger)
 * @param {boolean} [props.isDismissible=false] - Whether the alert can be closed by the user
 * @param {() => void} [props.onDismiss] - Callback when the alert is dismissed
 * @param {string} [props.className] - Additional CSS classes for the alert container
 *
 * @returns {JSX.Element} A styled alert box with message content and optional close button
 *
 * @example
 * <Alert variant="primary">This is an informational alert.</Alert>
 *
 * @example
 * <Alert variant="success" isDismissible onDismiss={() => setShow(false)}>
 *   Your changes have been saved successfully!
 * </Alert>
 *
 * @see {@link AlertProps} for prop definitions
 */

import { cn } from '@utils/cn';
import { alertVariants } from './Alert.variants';
import type { AlertProps } from './Alert.types';

export default function Alert({
  children,
  variant = 'primary',
  isDismissible = false,
  onDismiss,
  className,
  ...rest
}: AlertProps): JSX.Element {
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...rest}>
      {/* Alert message content */}
      <div className="flex-1 pr-2">{children}</div>
      {/* Dismiss/close button */}
      {isDismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:text-gray-400"
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

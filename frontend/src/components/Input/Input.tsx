/**
 * @module components/Input/Input
 * @description A text input field component with styling and error state handling.
 * Renders a styled <input> element and an optional error message.
 *
 * @component
 * @param {InputProps} props - {@link Input.types.ts|InputProps} for the input
 * @returns {JSX.Element} A styled text input with optional error message
 *
 * @example
 * // Basic usage
 * <Input placeholder="Enter your name" />
 *
 * @example
 * // Large input with an error message
 * <Input size="lg" isInvalid errorMessage="Name is required" />
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Three size options (sm, md, lg) adjusting padding and font size
 * - Integrated error state: red border and message when `isInvalid` is true
 * - Consistent styling with rounded borders and focus ring (primary color or danger on error)
 * - Disabled state styling (reduced opacity and no pointer events)
 * - Dark mode support (dark background, light text)
 *
 * @accessibility
 * - Sets `aria-invalid` attribute when in error state for screen readers
 * - Can accept `aria-label` or use placeholder for accessibility if no visible label
 * - Error message is rendered in a <p role="alert"> for immediate announcement
 * - Ensures sufficient contrast for text and placeholder in both light and dark themes
 *
 * @integration
 * Use for any text-based input (login forms, search bars, settings). For other input types (textarea, select, etc.), similar pattern can be extended.
 */

import { InputProps } from './Input.types';

export default function Input({
  size = 'md',
  isInvalid = false,
  errorMessage,
  className = '',
  type = 'text',
  ...rest
}: InputProps): JSX.Element {
  /**
   * Base classes for the input element (common styles)
   */
  const baseInputClasses =
    'block w-full rounded-md shadow-sm transition-smooth focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  /**
   * Determine border and focus ring classes based on validity
   */
  const stateClasses = isInvalid
    ? 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-danger-500'
    : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  /**
   * Text and background color classes (including dark mode)
   */
  const colorClasses =
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

  /**
   * Size-specific padding and font size classes
   */
  const sizeClasses = (() => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-3 text-lg';
      case 'md':
      default:
        return 'px-3 py-2 text-base';
    }
  })();

  return (
    <div className={`inline-block w-full ${className}`}>
      <input
        type={type}
        className={`${baseInputClasses} ${colorClasses} ${stateClasses} ${sizeClasses}`}
        aria-invalid={isInvalid || undefined}
        {...rest}
      />
      {isInvalid && errorMessage && (
        <p className="text-danger-600 dark:text-danger-500 text-sm mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

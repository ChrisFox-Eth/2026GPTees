/**
 * @module components/ui/Input
 * @description A text input field component with styling and error state handling
 * @since 2025-11-21
 */

/**
 * @component
 * @description A styled text input field component with support for multiple sizes and error states.
 * Includes integrated error message display and dark mode support.
 *
 * @param {InputProps} props - Component props
 * @param {InputSize} [props.size='md'] - Size of the input field (sm, md, lg)
 * @param {boolean} [props.isInvalid=false] - Whether the input is in an error state
 * @param {string} [props.errorMessage] - Error message to display below the input (optional)
 * @param {string} [props.className] - Additional CSS classes for the container
 * @param {string} [props.type='text'] - HTML input type
 *
 * @returns {JSX.Element} A styled text input with optional error message
 *
 * @example
 * <Input placeholder="Enter your name" />
 *
 * @example
 * <Input size="lg" isInvalid errorMessage="Name is required" />
 *
 * @see {@link InputProps} for prop definitions
 */

import { cn } from '@utils/cn';
import { inputVariants } from './Input.variants';
import type { InputProps } from './Input.types';

export default function Input({
  size = 'md',
  isInvalid = false,
  errorMessage,
  className,
  type = 'text',
  ...rest
}: InputProps): JSX.Element {
  const errorId = isInvalid && errorMessage ? `error-${Math.random().toString(36).slice(2, 9)}` : undefined;

  return (
    <div className={cn('inline-block w-full', className)}>
      <input
        type={type}
        className={inputVariants({ size, invalid: isInvalid })}
        aria-invalid={isInvalid || undefined}
        aria-describedby={errorId}
        {...rest}
      />
      {isInvalid && errorMessage && (
        <p id={errorId} className="text-danger-600 dark:text-danger-500 mt-1 text-sm" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * @module components/Input/Input
 * @description A flexible text input component with label, error, and helper text support.
 * Provides a consistent input field with various sizes, states, and optional prefix/suffix elements.
 *
 * @component
 * @param {InputProps} props - {@link Input.types.ts|InputProps} for the input
 * @returns {JSX.Element} A styled input element
 *
 * @example
 * // Basic input with label
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 *
 * @example
 * // Search input with error
 * <Input
 *   label="Search"
 *   type="search"
 *   placeholder="Search..."
 *   error="No results found"
 *   suffix={<span>🔍</span>}
 * />
 *
 * @example
 * // Number input with helper text
 * <Input
 *   label="Age"
 *   type="number"
 *   min="0"
 *   max="120"
 *   helperText="Must be between 0 and 120"
 * />
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @features
 * - Multiple input types (text, email, password, number, search, url, tel)
 * - Optional label with styling
 * - Error state with error message
 * - Helper text for additional guidance
 * - Three size options (sm, md, lg)
 * - Prefix and suffix support for icons/content
 * - Disabled and read-only states
 * - Auto-focus support
 * - Dark mode support
 * - Full keyboard accessibility
 *
 * @accessibility
 * - Associated label for screen readers
 * - Error messages linked via aria-describedby
 * - Helper text properly associated
 * - Focus indicators for keyboard navigation
 *
 * @integration
 * Use in forms for collecting user input. Combine with Button component
 * for complete form experiences. Pair with validation logic for forms.
 *
 * @status Active
 * @category Form Components
 */

import { forwardRef } from 'react';
import { InputProps } from './Input.types';

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      isDisabled = false,
      isReadOnly = false,
      isFocused = false,
      size = 'md',
      placeholder,
      type = 'text',
      prefix,
      suffix,
      className = '',
      ...rest
    },
    ref
  ): JSX.Element => {
    /**
     * Get base input classes
     */
    const baseClasses =
      'w-full px-4 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-700 dark:text-white dark:border-gray-600';

    /**
     * Get size-specific classes
     * @returns {string} Size classes
     */
    const getSizeClasses = (): string => {
      switch (size) {
        case 'sm':
          return 'px-3 py-1.5 text-sm';
        case 'lg':
          return 'px-5 py-3 text-lg';
        case 'md':
        default:
          return 'px-4 py-2 text-base';
      }
    };

    /**
     * Get state-specific border and ring classes
     * @returns {string} State classes
     */
    const getStateClasses = (): string => {
      if (error) {
        return 'border-danger-500 focus:ring-danger-500 dark:border-danger-500';
      }
      return 'border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600';
    };

    /**
     * Get disabled/readonly classes
     * @returns {string} Disabled/readonly classes
     */
    const getDisabledClasses = (): string => {
      if (isDisabled || isReadOnly) {
        return 'bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed';
      }
      return 'bg-white dark:bg-gray-700';
    };

    const inputId = rest.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            placeholder={placeholder}
            disabled={isDisabled}
            readOnly={isReadOnly}
            autoFocus={isFocused}
            className={`${baseClasses} ${getSizeClasses()} ${getStateClasses()} ${getDisabledClasses()} ${
              prefix ? 'pl-10' : ''
            } ${suffix ? 'pr-10' : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...rest}
          />

          {suffix && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

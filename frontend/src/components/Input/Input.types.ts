/**
 * @module components/Input/Input.types
 * @description Type definitions for the Input component (text field)
 * @since 2025-10-28
 */

import type React from 'react';

/**
 * Supported input sizes (affect padding and font size)
 * @typedef {('sm' | 'md' | 'lg')} InputSize
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Input component
 * @typedef {Object} InputProps
 * @property {InputSize} [size='md'] - Size of the input field
 * @property {boolean} [isInvalid=false] - Whether the input is in an error state
 * @property {string} [errorMessage] - Error message to display below the input (if isInvalid)
 * @property {string} [className] - Additional CSS classes for the container
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

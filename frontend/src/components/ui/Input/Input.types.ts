/**
 * @module components/ui/Input
 * @description Type definitions for the Input component
 * @since 2025-11-21
 */

import type React from 'react';

/**
 * Supported input sizes (affect padding and font size)
 * @typedef {('sm' | 'md' | 'lg')} InputSize
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Input component
 * @interface InputProps
 * @extends {Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>}
 *
 * @property {InputSize} [size='md'] - Size of the input field
 * @property {boolean} [isInvalid=false] - Whether the input is in an error state
 * @property {string} [errorMessage] - Error message to display below the input (optional)
 * @property {string} [className] - Additional CSS classes for the container
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

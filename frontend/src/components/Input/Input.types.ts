/**
 * @module components/Input/Input.types
 * @description Type definitions for the Input component
 * @since 2025-10-20
 * @author Template
 */

/**
 * Supported input types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';

/**
 * Input size variants
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  label?: string;
  error?: string;
  helperText?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isFocused?: boolean;
  size?: InputSize;
  icon?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
}


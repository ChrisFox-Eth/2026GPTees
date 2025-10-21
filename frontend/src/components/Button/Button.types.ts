/**
 * @module components/Button/Button.types
 * @description Type definitions for the Button component
 * @since 2025-10-20
 * @author Template
 */

/**
 * Supported button variants for different use cases
 * @typedef {('primary' | 'secondary' | 'danger' | 'success' | 'warning')} ButtonVariant
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

/**
 * Supported button sizes
 * @typedef {('sm' | 'md' | 'lg')} ButtonSize
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Button component
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} children - Content to display inside the button
 * @property {ButtonVariant} [variant='primary'] - Button variant/style
 * @property {ButtonSize} [size='md'] - Button size
 * @property {boolean} [isDisabled=false] - Whether the button is disabled
 * @property {boolean} [isLoading=false] - Whether the button is in a loading state
 * @property {string} [className] - Additional CSS classes to apply
 * @property {() => void} onClick - Callback function when button is clicked
 * @property {'button' | 'submit' | 'reset'} [type='button'] - HTML button type
 * @property {string} [ariaLabel] - ARIA label for accessibility
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

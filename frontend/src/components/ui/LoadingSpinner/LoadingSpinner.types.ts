/**
 * @module components/ui/LoadingSpinner
 * @description Type definitions for LoadingSpinner component
 * @since 2025-11-21
 */

/**
 * Props for the LoadingSpinner component
 * @interface LoadingSpinnerProps
 *
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size of the spinner
 * @property {string} [text] - Optional text to display below the spinner (optional)
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

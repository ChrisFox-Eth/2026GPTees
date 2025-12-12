/**
 * @module components/ui/LoadingSpinner
 * @description Reusable loading spinner component for indicating loading states
 * @since 2025-11-21
 */

/**
 * @component
 * @description An animated loading spinner with configurable size and optional text.
 * Displays a circular spinner with primary color theme.
 *
 * @param {LoadingSpinnerProps} props - Component props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size of the spinner (sm, md, lg)
 * @param {string} [props.text] - Optional text to display below the spinner (optional)
 *
 * @returns {JSX.Element} An animated loading spinner
 *
 * @example
 * <LoadingSpinner />
 *
 * @example
 * <LoadingSpinner size="lg" text="Loading data..." />
 *
 * @see {@link LoadingSpinnerProps} for prop definitions
 */

import type { LoadingSpinnerProps } from './LoadingSpinner.types';

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps): JSX.Element {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`border-primary-600 animate-spin rounded-full border-b-2 ${sizeClasses[size]}`}
      />
      {text && <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>}
    </div>
  );
}

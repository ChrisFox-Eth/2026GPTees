/**
 * @module components/ui/Button
 * @description CVA variant definitions for the Button component
 * @since 2025-11-21
 */

import { cva } from 'class-variance-authority';

/**
 * @const buttonVariants
 * @description CVA variant configuration for Button component
 *
 * @variant variant - Visual style options (primary, secondary, danger, success, warning, pulse-gradient)
 * @variant size - Size presets (sm, md, lg)
 *
 * @default variant="primary" size="md"
 */
export const buttonVariants = cva(
  // Base classes applied to all buttons
  'inline-flex items-center justify-center font-medium rounded-md transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600',
        secondary:
          'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:outline-secondary-500 dark:bg-secondary-700 dark:hover:bg-secondary-600',
        danger:
          'bg-danger-600 text-white hover:bg-danger-700 focus-visible:outline-danger-500 dark:bg-danger-700 dark:hover:bg-danger-600',
        success:
          'bg-success-600 text-white hover:bg-success-700 focus-visible:outline-success-500 dark:bg-success-700 dark:hover:bg-success-600',
        warning:
          'bg-warning-600 text-white hover:bg-warning-700 focus-visible:outline-warning-500 dark:bg-warning-700 dark:hover:bg-warning-600',
        'pulse-gradient': 'btn-pulse-gradient text-white',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

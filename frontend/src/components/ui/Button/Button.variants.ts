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
          'bg-accent text-surface hover:bg-primary-700 focus-visible:outline-accent dark:bg-accent-dark dark:hover:bg-primary-600',
        secondary:
          'bg-accent-soft text-ink hover:bg-muted/20 focus-visible:outline-muted dark:bg-surface-dark dark:text-ink-dark dark:hover:bg-muted-dark/20',
        danger:
          'bg-danger-600 text-surface hover:bg-danger-700 focus-visible:outline-danger-500 dark:bg-danger-700 dark:hover:bg-danger-600',
        success:
          'bg-success-600 text-surface hover:bg-success-700 focus-visible:outline-success-500 dark:bg-success-700 dark:hover:bg-success-600',
        warning:
          'bg-warning-600 text-ink hover:bg-warning-700 focus-visible:outline-warning-500 dark:bg-warning-700 dark:hover:bg-warning-600',
        'pulse-gradient': 'btn-pulse-gradient text-surface',
      },
      size: {
        sm: 'px-3 py-2.5 text-sm min-h-[44px]',
        md: 'px-4 py-3 text-base min-h-[44px]',
        lg: 'px-6 py-3 text-lg min-h-[48px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

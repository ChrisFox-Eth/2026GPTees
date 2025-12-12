/**
 * @module components/ui/Alert
 * @description CVA variant definitions for the Alert component
 * @since 2025-11-21
 */

import { cva } from 'class-variance-authority';

/**
 * @const alertVariants
 * @description CVA variant configuration for Alert component
 *
 * @variant variant - Visual style options (primary, secondary, success, warning, danger)
 *
 * @default variant="primary"
 */
export const alertVariants = cva(
  // Base classes
  'p-4 rounded-md flex items-start justify-between border',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-primary-200 dark:border-primary-800',
        secondary:
          'bg-secondary-50 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 border-secondary-200 dark:border-secondary-800',
        success:
          'bg-success-50 dark:bg-success-900 text-success-800 dark:text-success-200 border-success-200 dark:border-success-800',
        warning:
          'bg-warning-50 dark:bg-warning-900 text-warning-800 dark:text-warning-200 border-warning-200 dark:border-warning-800',
        danger:
          'bg-danger-50 dark:bg-danger-900 text-danger-800 dark:text-danger-200 border-danger-200 dark:border-danger-800',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

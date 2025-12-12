/**
 * @module components/ui/Card
 * @description CVA variant definitions for the Card component
 * @since 2025-11-21
 */

import { cva } from 'class-variance-authority';

/**
 * @const cardVariants
 * @description CVA variant configuration for Card component
 *
 * @variant variant - Visual style options (default, bordered, flat, elevated)
 * @variant hoverable - Hover effect enabling (true, false)
 *
 * @default variant="default" hoverable=false
 */
export const cardVariants = cva(
  // Base classes
  'rounded-lg transition-smooth dark:bg-surface-dark dark:text-ink-dark',
  {
    variants: {
      variant: {
        default: 'bg-surface dark:bg-surface-dark shadow-medium',
        bordered: 'bg-surface border-2 border-surface-2 dark:border-muted-dark',
        flat: 'bg-surface-2 dark:bg-paper-dark border border-surface-2 dark:border-surface-dark',
        elevated: 'bg-surface dark:bg-surface-dark shadow-lifted',
      },
      hoverable: {
        true: 'hover:shadow-lifted dark:hover:shadow-2xl cursor-pointer transform hover:scale-105',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hoverable: false,
    },
  }
);

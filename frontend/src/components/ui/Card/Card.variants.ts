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
  'rounded-lg transition-smooth dark:bg-gray-800 dark:text-white',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 shadow-md',
        bordered: 'bg-white border-2 border-gray-200 dark:border-gray-700',
        flat: 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800',
        elevated: 'bg-white dark:bg-gray-800 shadow-lg',
      },
      hoverable: {
        true: 'hover:shadow-lg dark:hover:shadow-2xl cursor-pointer transform hover:scale-105',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hoverable: false,
    },
  }
);

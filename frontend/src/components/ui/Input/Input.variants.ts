/**
 * @module components/ui/Input
 * @description CVA variant definitions for the Input component
 * @since 2025-11-21
 */

import { cva } from 'class-variance-authority';

/**
 * @const inputVariants
 * @description CVA variant configuration for Input component
 *
 * @variant size - Size presets (sm, md, lg)
 * @variant invalid - Error state styling (true, false)
 *
 * @default size="md" invalid=false
 */
export const inputVariants = cva(
  // Base classes
  'block w-full rounded-md shadow-sm transition-smooth focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
      },
      invalid: {
        true: 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-danger-500',
        false: 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
);

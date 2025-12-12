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
  'block w-full rounded-md shadow-soft transition-smooth focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark placeholder-muted dark:placeholder-muted-dark',
  {
    variants: {
      size: {
        sm: 'px-2 py-2.5 text-sm min-h-[44px]',
        md: 'px-3 py-3 text-base min-h-[44px]',
        lg: 'px-4 py-3.5 text-lg min-h-[48px]',
      },
      invalid: {
        true: 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-danger-500',
        false: 'border-surface-2 focus:ring-2 focus:ring-accent focus:border-accent dark:border-muted-dark dark:focus:ring-accent-dark dark:focus:border-accent-dark',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
);

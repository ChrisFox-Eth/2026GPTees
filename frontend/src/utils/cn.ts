/**
 * @module utils/cn
 * @description Class name utility that combines clsx and tailwind-merge for
 * conditional class composition with Tailwind CSS conflict resolution.
 * @since 2025-12-11
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @function cn
 * @description Combines class names using clsx and resolves Tailwind CSS conflicts
 * using tailwind-merge. Accepts any combination of strings, objects, arrays, and
 * falsy values that clsx supports.
 *
 * @param {...ClassValue[]} inputs - Class values to combine (strings, objects, arrays, conditionals)
 * @returns {string} Merged class string with Tailwind conflicts resolved
 *
 * @example
 * // Basic usage - later classes override earlier ones
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 wins over px-2)
 *
 * @example
 * // Conditional classes
 * cn('bg-red-500', isActive && 'bg-blue-500') // applies bg-blue-500 only if isActive
 *
 * @example
 * // With CVA variants
 * cn(buttonVariants({ variant, size }), className)
 *
 * @see {@link https://github.com/lukeed/clsx} clsx documentation
 * @see {@link https://github.com/dcastil/tailwind-merge} tailwind-merge documentation
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

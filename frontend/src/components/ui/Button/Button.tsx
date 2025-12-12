/**
 * @module components/ui/Button
 * @description A reusable button component with multiple variants and sizes
 * @since 2025-11-21
 */

/**
 * @component
 * @description A flexible button component supporting multiple variants, sizes, and states (loading, disabled).
 * Provides consistent styling and accessibility across the application.
 *
 * @param {ButtonProps} props - Component props
 * @param {React.ReactNode} props.children - Content to display inside the button
 * @param {ButtonVariant} [props.variant='primary'] - Button style variant
 * @param {ButtonSize} [props.size='md'] - Button size preset
 * @param {boolean} [props.isDisabled=false] - Whether the button is disabled
 * @param {boolean} [props.isLoading=false] - Whether the button is in a loading state
 * @param {string} [props.className] - Additional CSS classes
 * @param {() => void} [props.onClick] - Click handler callback
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - HTML button type
 * @param {string} [props.ariaLabel] - ARIA label for accessibility
 *
 * @returns {JSX.Element} A styled button element
 *
 * @example
 * <Button onClick={() => console.log('Clicked!')}>Click Me</Button>
 *
 * @example
 * <Button variant="danger" isLoading>Deleting...</Button>
 *
 * @see {@link ButtonProps} for prop definitions
 */

import { cn } from '@utils/cn';
import { buttonVariants } from './Button.variants';
import type { ButtonProps } from './Button.types';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  className,
  onClick,
  type = 'button',
  ariaLabel,
  ...rest
}: ButtonProps): JSX.Element {
  /**
   * Handle button click with loading state check
   */
  const handleClick = () => {
    if (!isLoading && !isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={cn(buttonVariants({ variant, size }), className)}
      aria-label={ariaLabel}
      aria-disabled={isDisabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg
            className="mr-2 h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading, please wait.</span>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

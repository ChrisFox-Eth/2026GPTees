/**
 * @module components/ui/Card
 * @description A versatile card component for containing content with various styles
 * @since 2025-11-21
 */

/**
 * @component
 * @description A flexible card container component with support for headers, titles, footers,
 * and multiple visual variants. Supports hover effects and click handlers.
 *
 * @param {CardProps} props - Component props
 * @param {React.ReactNode} props.children - Content to display inside the card
 * @param {CardVariant} [props.variant='default'] - Card style variant (default, bordered, flat, elevated)
 * @param {string} [props.title] - Optional title at the top of the card
 * @param {string} [props.subtitle] - Optional subtitle below the title
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * @param {React.ReactNode} [props.header] - Optional custom header content
 * @param {boolean} [props.isHoverable=false] - Whether the card has hover effect
 * @param {() => void} [props.onClick] - Optional click handler
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} A styled card element
 *
 * @example
 * <Card title="Card Title">This is the card content</Card>
 *
 * @example
 * <Card
 *   title="User Profile"
 *   variant="elevated"
 *   isHoverable
 *   onClick={() => console.log('clicked')}
 * >
 *   Content goes here
 * </Card>
 *
 * @see {@link CardProps} for prop definitions
 */

import { cn } from '@utils/cn';
import { cardVariants } from './Card.variants';
import type { CardProps } from './Card.types';

export default function Card({
  children,
  variant = 'default',
  title,
  subtitle,
  footer,
  header,
  isHoverable = false,
  onClick,
  className,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(cardVariants({ variant, hoverable: isHoverable }), className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick();
              }
            }
          : undefined
      }
      {...rest}
    >
      {header && <div className="overflow-hidden rounded-t-lg">{header}</div>}

      <div className="p-6">
        {title && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        )}

        <div className={title ? 'mt-4' : ''}>{children}</div>
      </div>

      {footer && (
        <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
}

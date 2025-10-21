/**
 * @module components/Card/Card
 * @description A versatile card component for containing content with various styles.
 * Provides a flexible container with support for headers, titles, footers, and multiple
 * visual variants for different use cases.
 *
 * @component
 * @param {CardProps} props - {@link Card.types.ts|CardProps} for the card
 * @returns {JSX.Element} A styled card element
 *
 * @example
 * // Basic card with title
 * <Card title="Card Title">
 *   This is the card content
 * </Card>
 *
 * @example
 * // Card with all features
 * <Card
 *   title="User Profile"
 *   subtitle="Active member"
 *   variant="elevated"
 *   isHoverable
 *   onClick={() => console.log('clicked')}
 *   footer={<p>Last updated: today</p>}
 * >
 *   Content goes here
 * </Card>
 *
 * @example
 * // Card with custom header
 * <Card
 *   header={<img src="banner.jpg" alt="Banner" className="w-full rounded-t-lg" />}
 *   title="Title Below Image"
 * >
 *   Card content below the image
 * </Card>
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @features
 * - Multiple visual variants (default, bordered, flat, elevated)
 * - Optional title and subtitle
 * - Custom header content support
 * - Optional footer
 * - Hover effects when enabled
 * - Click handler support
 * - Dark mode support
 * - Responsive padding and spacing
 *
 * @accessibility
 * - Semantic HTML structure
 * - Proper heading hierarchy with titles
 * - Click handlers are keyboard accessible
 *
 * @integration
 * Use for content grouping, product displays, user profiles, and dashboard widgets.
 * Combine with Button and other components for interactive cards.
 *
 * @status Active
 * @category UI Components
 */

import { CardProps } from './Card.types';

export default function Card({
  children,
  variant = 'default',
  title,
  subtitle,
  footer,
  header,
  isHoverable = false,
  onClick,
  className = '',
  ...rest
}: CardProps): JSX.Element {
  /**
   * Get base card classes
   */
  const baseClasses =
    'rounded-lg transition-smooth dark:bg-gray-800 dark:text-white';

  /**
   * Get variant-specific classes
   * @returns {string} Variant classes
   */
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'bordered':
        return 'bg-white border-2 border-gray-200 dark:border-gray-700';
      case 'flat':
        return 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800';
      case 'elevated':
        return 'bg-white dark:bg-gray-800 shadow-lg';
      case 'default':
      default:
        return 'bg-white dark:bg-gray-800 shadow-md';
    }
  };

  /**
   * Get hover classes
   */
  const getHoverClasses = (): string => {
    if (!isHoverable) return '';
    return 'hover:shadow-lg dark:hover:shadow-2xl cursor-pointer transform hover:scale-105';
  };

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${getHoverClasses()} ${className}`}
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
            {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
        )}

        <div className={title ? 'mt-4' : ''}>{children}</div>
      </div>

      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg text-sm text-gray-600 dark:text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
}

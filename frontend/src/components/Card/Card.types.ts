/**
 * @module components/Card/Card.types
 * @description Type definitions for the Card component
 * @since 2025-10-20
 * @author Template
 */

/**
 * Card variant styles
 * @typedef {('default' | 'bordered' | 'flat' | 'elevated')} CardVariant
 */
export type CardVariant = 'default' | 'bordered' | 'flat' | 'elevated';

/**
 * Props for the Card component
 * @typedef {Object} CardProps
 * @property {React.ReactNode} children - Content to display inside the card
 * @property {CardVariant} [variant='default'] - Card style variant
 * @property {string} [title] - Optional title at the top of the card
 * @property {string} [subtitle] - Optional subtitle below the title
 * @property {React.ReactNode} [footer] - Optional footer content
 * @property {React.ReactNode} [header] - Optional custom header content
 * @property {boolean} [isHoverable=false] - Whether the card has hover effect
 * @property {() => void} [onClick] - Optional click handler
 * @property {string} [className] - Additional CSS classes to apply
 * @property {React.HTMLAttributes<HTMLDivElement>} - Standard HTML div attributes
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  isHoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

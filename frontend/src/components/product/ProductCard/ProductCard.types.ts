/**
 * @module components/product/ProductCard/types
 * @description Type definitions for ProductCard component
 * @since 2025-11-21
 */

import type { Product } from '../../../types/product';

/**
 * Props for the ProductCard component
 * @interface ProductCardProps
 */
export interface ProductCardProps {
  /** Product data to display including name, image, colors, sizes, and description */
  product: Product;
  /** Callback function invoked when the card is clicked or activated via keyboard */
  onClick: () => void;
}

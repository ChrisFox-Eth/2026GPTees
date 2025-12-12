/**
 * @module components/product/ProductModal/types
 * @description Type definitions for ProductModal component
 * @since 2025-11-21
 */

import type { Product } from '../../../types/product';

/**
 * Props for the ProductModal component
 * @interface ProductModalProps
 */
export interface ProductModalProps {
  /** Product data with available sizes, colors, pricing, and details */
  product: Product;
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
}

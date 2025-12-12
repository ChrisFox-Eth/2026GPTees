/**
 * @module types/admin
 * @description Admin page related type definitions.
 * @since 2025-11-21
 */

/**
 * @interface SyncResultItem
 * @description Represents a single order synchronization result between the internal system and Printful
 *
 * @property {string} orderId - Internal order unique identifier
 * @property {string} orderNumber - Human-readable order reference number
 * @property {string} printfulOrderId - Printful's external order identifier
 * @property {string} fromStatus - Order status before the synchronization
 * @property {string} toStatus - Order status after the synchronization
 * @property {string | null} fulfillmentStatus - Current fulfillment state in Printful (null if not fulfilled)
 * @property {string} [trackingNumber] - Shipping tracking number if order has been shipped (optional)
 * @property {string} [error] - Error message if synchronization failed for this order (optional)
 */
export interface SyncResultItem {
  orderId: string;
  orderNumber: string;
  printfulOrderId: string;
  fromStatus: string;
  toStatus: string;
  fulfillmentStatus: string | null;
  trackingNumber?: string;
  error?: string;
}

/**
 * @interface SyncResult
 * @description Aggregated results from a batch order synchronization operation with Printful
 *
 * @property {number} total - Total number of orders processed in the sync operation
 * @property {number} updated - Number of orders that had status changes during sync
 * @property {SyncResultItem[]} results - Detailed array of individual order sync results
 */
export interface SyncResult {
  total: number;
  updated: number;
  results: SyncResultItem[];
}

/**
 * @interface VariantResult
 * @description Represents a Printful product variant lookup result showing available product configurations
 *
 * @property {number} id - Printful's unique variant identifier
 * @property {string} color - Color name/description of the product variant
 * @property {string} size - Size designation of the product variant (e.g., 'S', 'M', 'L', 'XL')
 */
export interface VariantResult {
  id: number;
  color: string;
  size: string;
}

/**
 * @module types/order
 * @description Order and checkout related type definitions.
 * @since 2025-11-21
 */

import type { Product } from './product';
import type { Design } from './design';

/**
 * @typedef {'PENDING_PAYMENT' | 'PAID' | 'DESIGN_PENDING' | 'DESIGN_APPROVED' | 'SUBMITTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'} OrderStatus
 * @description Status states for orders throughout the purchase and fulfillment lifecycle
 */
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DESIGN_PENDING'
  | 'DESIGN_APPROVED'
  | 'SUBMITTED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

/**
 * @typedef {'LIMITLESS' | 'PREMIUM' | 'BASIC' | 'TEST'} DesignTier
 * @description Product pricing tiers that determine design generation limits and pricing
 */
export type DesignTier = 'LIMITLESS' | 'PREMIUM' | 'BASIC' | 'TEST';

/**
 * @interface OrderItemProduct
 * @description Minimal product information embedded in order items
 *
 * @property {string} [id] - Product unique identifier (optional)
 * @property {string} name - Product name/title
 * @property {string | null} [imageUrl] - URL to product image (optional)
 */
export interface OrderItemProduct {
  id?: string;
  name: string;
  imageUrl?: string | null;
}

/**
 * @interface OrderItem
 * @description Represents a line item in an order with product, design, and pricing details
 *
 * @property {string} id - Unique identifier for this order item
 * @property {string} [orderId] - ID of the parent order (optional)
 * @property {string} [productId] - ID of the product being ordered (optional)
 * @property {string | null} [designId] - ID of the design applied to this item, null if no custom design (optional)
 * @property {number} quantity - Number of units ordered for this item
 * @property {string} size - Selected size option (e.g., 'S', 'M', 'L', 'XL')
 * @property {string} color - Selected color option
 * @property {number | string} unitPrice - Price per unit in cents (may be number or string for compatibility)
 * @property {string | null} [printfulVariantId] - Printful's variant identifier for fulfillment (optional)
 * @property {Product | OrderItemProduct} [product] - Associated product details (optional)
 * @property {Design | null} [design] - Associated custom design details, null if no design (optional)
 */
export interface OrderItem {
  id: string;
  orderId?: string;
  productId?: string;
  designId?: string | null;
  quantity: number;
  size: string;
  color: string;
  unitPrice: number | string;
  printfulVariantId?: string | null;
  product?: Product | OrderItemProduct;
  design?: Design | null;
}

/**
 * @interface ShippingAddress
 * @description Customer shipping address for order fulfillment
 *
 * @property {string} name - Recipient's full name
 * @property {string} address1 - Primary street address line
 * @property {string | null} [address2] - Secondary address line (apt, suite, etc.) (optional)
 * @property {string} city - City name
 * @property {string | null} [state] - State/province code or name (optional)
 * @property {string} zip - Postal/ZIP code
 * @property {string} country - Country code (e.g., 'US', 'CA')
 * @property {string | null} [phone] - Contact phone number (optional)
 */
export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string | null;
  city: string;
  state?: string | null;
  zip: string;
  country: string;
  phone?: string | null;
}

/**
 * @interface AppliedPromoCode
 * @description Information about a promotional code applied to an order
 *
 * @property {string} code - The promo code string that was applied
 * @property {string} type - Type of discount (e.g., 'FREE_PRODUCT', 'PERCENT_OFF')
 * @property {number | null} [percentOff] - Percentage discount amount if type is PERCENT_OFF (optional)
 * @property {string | null} [productTier] - Product tier granted if type is FREE_PRODUCT (optional)
 */
export interface AppliedPromoCode {
  code: string;
  type: string;
  percentOff?: number | null;
  productTier?: string | null;
}

/**
 * @interface DesignPreview
 * @description Condensed design information for order previews and summaries
 *
 * @property {string} id - Unique design identifier
 * @property {string} imageUrl - URL to the design image
 * @property {string} prompt - User prompt that generated this design
 * @property {boolean} [approvalStatus] - Whether the design has been approved by the user (optional)
 * @property {string} [status] - Current generation/approval status of the design (optional)
 */
export interface DesignPreview {
  id: string;
  imageUrl: string;
  prompt: string;
  approvalStatus?: boolean;
  status?: string;
}

/**
 * @interface Order
 * @description Complete order record with items, designs, shipping, and payment tracking
 *
 * @property {string} id - Unique order identifier
 * @property {string} orderNumber - Human-readable order reference number
 * @property {OrderStatus | string} status - Current order status in the lifecycle
 * @property {number | string} totalAmount - Total order amount in cents (may be number or string)
 * @property {DesignTier | string} designTier - Pricing tier determining design generation limits
 * @property {number} designsGenerated - Number of designs already generated for this order
 * @property {number} maxDesigns - Maximum number of designs allowed for this tier
 * @property {string | null} [stripeCheckoutId] - Stripe checkout session identifier (optional)
 * @property {string | null} [paidAt] - ISO timestamp when payment was completed (optional)
 * @property {string} createdAt - ISO timestamp when the order was created
 * @property {OrderItem[]} items - Array of line items in this order
 * @property {DesignPreview[]} designs - Array of designs associated with this order
 * @property {ShippingAddress | null} [address] - Shipping address for this order (optional)
 * @property {string | null} [fulfillmentStatus] - Current fulfillment status from Printful (optional)
 * @property {string | null} [trackingNumber] - Shipping tracking number if order has shipped (optional)
 * @property {AppliedPromoCode | null} [promoCode] - Promotional code applied to this order (optional)
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus | string;
  totalAmount: number | string;
  designTier: DesignTier | string;
  designsGenerated: number;
  maxDesigns: number;
  stripeCheckoutId?: string | null;
  paidAt?: string | null;
  createdAt: string;
  items: OrderItem[];
  designs: DesignPreview[];
  address?: ShippingAddress | null;
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
  promoCode?: AppliedPromoCode | null;
}

/**
 * @interface OrderSummaryItem
 * @description Simplified line item for order summary displays
 *
 * @property {string} productName - Name of the product
 * @property {string} size - Selected size
 * @property {string} color - Selected color
 * @property {number} quantity - Quantity ordered
 * @property {number} unitPrice - Price per unit in cents
 */
export interface OrderSummaryItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

/**
 * @interface OrderSummary
 * @description Order summary for checkout and confirmation displays
 *
 * @property {number} totalAmount - Total order amount in cents
 * @property {OrderSummaryItem[]} items - Array of summarized line items
 * @property {number} [shipping] - Shipping cost in cents (optional)
 * @property {string} [tier] - Design tier for this order (optional)
 * @property {string} [country] - Destination country code (optional)
 * @property {AppliedPromoCode | null} [promoCode] - Applied promotional code details (optional)
 */
export interface OrderSummary {
  totalAmount: number;
  items: OrderSummaryItem[];
  shipping?: number;
  tier?: string;
  country?: string;
  promoCode?: AppliedPromoCode | null;
}

/**
 * @module types/order
 * @description Order and checkout related type definitions.
 */

import type { Product } from './product';
import type { Design } from './design';

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

export type DesignTier = 'LIMITLESS' | 'PREMIUM';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  designId?: string | null;
  quantity: number;
  size: string;
  color: string;
  unitPrice: number | string;
  printfulVariantId?: string | null;
  product?: Product;
  design?: Design | null;
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number | string;
  designTier: DesignTier;
  designsGenerated: number;
  maxDesigns: number;
  stripeCheckoutId?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  items: OrderItem[];
}

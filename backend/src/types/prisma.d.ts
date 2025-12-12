/**
 * @module types/prisma
 * @description Minimal Prisma type declarations for build-time compatibility
 * Provides type stubs when Prisma client is not yet generated
 * @since 2025-11-21
 */

declare module '@prisma/client' {
  /**
   * @class PrismaClient
   * @description Minimal Prisma client stub for build-time
   */
  export class PrismaClient {
    constructor(options?: any);
    [key: string]: any;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction: any;
    $queryRawUnsafe: any;
    order: any;
    design: any;
    product: any;
    promoCode: any;
    settings: any;
    address: any;
    user: any;
    payment: any;
    orderItem: any;
    fulfillmentEvent: any;
  }
  export type Prisma = any;

  /**
   * @enum OrderStatus
   * @description Order status enumeration
   */
  export const OrderStatus: {
    PENDING_PAYMENT: 'PENDING_PAYMENT';
    PAID: 'PAID';
    DESIGN_PENDING: 'DESIGN_PENDING';
    DESIGN_APPROVED: 'DESIGN_APPROVED';
    SUBMITTED: 'SUBMITTED';
    SHIPPED: 'SHIPPED';
    DELIVERED: 'DELIVERED';
    CANCELLED: 'CANCELLED';
    REFUNDED: 'REFUNDED';
  };

  /**
   * @type OrderStatus
   * @description Order status type union
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
   * @type PromoCode
   * @description Promo code type stub
   */
  export type PromoCode = any;
}

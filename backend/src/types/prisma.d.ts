declare module '@prisma/client' {
  // Minimal Prisma types/values for build-time only.
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
  export type PromoCode = any;
}

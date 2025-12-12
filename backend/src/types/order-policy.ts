import { OrderStatus } from '@prisma/client';

export type OrderPolicyAction =
  | 'design_generate_authed'
  | 'design_generate_guest'
  | 'design_clone_to_preview'
  | 'order_preview_variant_update'
  | 'design_approve'
  | 'order_submit_fulfillment'
  | 'order_claim_preview'
  | 'order_checkout';

export interface OrderPolicyActionDefinition {
  action: OrderPolicyAction;
  allowedStatuses: ReadonlyArray<OrderStatus>;
  errorMessage: string;
}

export type OrderPolicyActionMap = Record<OrderPolicyAction, OrderPolicyActionDefinition>;

export type OrderStatusTransitionMap = Record<OrderStatus, ReadonlyArray<OrderStatus>>;

export const ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.DESIGN_PENDING,
  OrderStatus.PAID,
  OrderStatus.DESIGN_APPROVED,
  OrderStatus.SUBMITTED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

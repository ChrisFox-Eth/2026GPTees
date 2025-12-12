import { OrderStatus } from '@prisma/client';
import type {
  OrderPolicyAction,
  OrderPolicyActionMap,
  OrderStatusTransitionMap,
} from '../types/order-policy.js';
import { ORDER_STATUSES } from '../types/order-policy.js';

export const ORDER_POLICY_ACTIONS: OrderPolicyActionMap = {
  design_generate_authed: {
    action: 'design_generate_authed',
    allowedStatuses: [OrderStatus.PAID, OrderStatus.DESIGN_PENDING, OrderStatus.PENDING_PAYMENT],
    errorMessage: 'Order must be active or pending payment before generating designs',
  },
  design_generate_guest: {
    action: 'design_generate_guest',
    allowedStatuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.DESIGN_PENDING],
    errorMessage: 'Order must be an unpaid preview before generating designs',
  },
  design_clone_to_preview: {
    action: 'design_clone_to_preview',
    allowedStatuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.DESIGN_PENDING],
    errorMessage: 'Target order must be an unpaid preview order',
  },
  order_preview_variant_update: {
    action: 'order_preview_variant_update',
    allowedStatuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.DESIGN_PENDING],
    errorMessage: 'Size and color can only be changed before payment is completed',
  },
  design_approve: {
    action: 'design_approve',
    allowedStatuses: [OrderStatus.PAID, OrderStatus.DESIGN_APPROVED],
    errorMessage: 'Payment is required before approving a design. Please checkout first.',
  },
  order_submit_fulfillment: {
    action: 'order_submit_fulfillment',
    allowedStatuses: [OrderStatus.PAID, OrderStatus.DESIGN_APPROVED],
    errorMessage: 'Payment is required before submitting for fulfillment.',
  },
  order_claim_preview: {
    action: 'order_claim_preview',
    allowedStatuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.DESIGN_PENDING],
    errorMessage: 'This order has already been processed',
  },
  order_checkout: {
    action: 'order_checkout',
    allowedStatuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.DESIGN_PENDING],
    errorMessage: 'This order has already been processed.',
  },
};

export const ORDER_STATUS_TRANSITIONS: OrderStatusTransitionMap = {
  [OrderStatus.PENDING_PAYMENT]: [
    OrderStatus.DESIGN_PENDING,
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DESIGN_PENDING]: [
    OrderStatus.DESIGN_PENDING,
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.DESIGN_PENDING,
    OrderStatus.DESIGN_APPROVED,
    OrderStatus.SUBMITTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DESIGN_APPROVED]: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
  [OrderStatus.SUBMITTED]: [OrderStatus.SUBMITTED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.DELIVERED],
  [OrderStatus.CANCELLED]: [OrderStatus.CANCELLED],
  [OrderStatus.REFUNDED]: [OrderStatus.REFUNDED],
};

export function getOrderPolicyActionDefinition(action: OrderPolicyAction) {
  return ORDER_POLICY_ACTIONS[action];
}

export function isOrderActionAllowed(action: OrderPolicyAction, status: OrderStatus): boolean {
  const definition = getOrderPolicyActionDefinition(action);
  return definition.allowedStatuses.includes(status);
}

export function getOrderActionErrorMessage(action: OrderPolicyAction): string {
  return getOrderPolicyActionDefinition(action).errorMessage;
}

export function getAllowedStatusesForAction(action: OrderPolicyAction): ReadonlyArray<OrderStatus> {
  return getOrderPolicyActionDefinition(action).allowedStatuses;
}

export function isOrderStatusTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
  const allowedNext = ORDER_STATUS_TRANSITIONS[from] || [];
  return allowedNext.includes(to);
}

export function getAllowedNextStatuses(from: OrderStatus): ReadonlyArray<OrderStatus> {
  return ORDER_STATUS_TRANSITIONS[from] || [];
}

export function getOrderStatuses(): ReadonlyArray<OrderStatus> {
  return ORDER_STATUSES;
}

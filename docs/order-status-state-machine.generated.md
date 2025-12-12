# Order Status State Machine (generated)

Generated: 2025-12-12T22:10:20.461Z

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT
  PENDING_PAYMENT --> DESIGN_PENDING
  PENDING_PAYMENT --> PAID
  PENDING_PAYMENT --> CANCELLED
  DESIGN_PENDING --> DESIGN_PENDING
  DESIGN_PENDING --> PAID
  DESIGN_PENDING --> CANCELLED
  PAID --> DESIGN_PENDING
  PAID --> DESIGN_APPROVED
  PAID --> SUBMITTED
  PAID --> CANCELLED
  DESIGN_APPROVED --> SUBMITTED
  DESIGN_APPROVED --> CANCELLED
  SUBMITTED --> SUBMITTED
  SUBMITTED --> SHIPPED
  SUBMITTED --> DELIVERED
  SUBMITTED --> CANCELLED
  SHIPPED --> SHIPPED
  SHIPPED --> DELIVERED
  SHIPPED --> CANCELLED
  DELIVERED --> DELIVERED
  CANCELLED --> CANCELLED
  REFUNDED --> REFUNDED
```

## Allowed Actions

| Action | Allowed statuses |
| --- | --- |
| `design_approve` | `PAID`, `DESIGN_APPROVED` |
| `design_clone_to_preview` | `PENDING_PAYMENT`, `DESIGN_PENDING` |
| `design_generate_authed` | `PAID`, `DESIGN_PENDING`, `PENDING_PAYMENT` |
| `design_generate_guest` | `PENDING_PAYMENT`, `DESIGN_PENDING` |
| `order_checkout` | `PENDING_PAYMENT`, `DESIGN_PENDING` |
| `order_claim_preview` | `PENDING_PAYMENT`, `DESIGN_PENDING` |
| `order_preview_variant_update` | `PENDING_PAYMENT`, `DESIGN_PENDING` |
| `order_submit_fulfillment` | `PAID`, `DESIGN_APPROVED` |

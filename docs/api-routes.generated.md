# API Routes (generated)

Generated: 2025-12-12T20:31:03.497Z

| method | path | auth | handlers |
|---|---|---|---|
| GET | /api/admin/email-templates | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/email-templates/:name/preview | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/printful/variants | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/promo-codes | admin | requireAuth, requireAdmin, anonymous |
| POST | /api/admin/promo-codes | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/promo-codes/:id | admin | requireAuth, requireAdmin, anonymous |
| PATCH | /api/admin/promo-codes/:id/disable | admin | requireAuth, requireAdmin, anonymous |
| PATCH | /api/admin/promo-codes/:id/enable | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/promo-codes/:id/metrics | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/admin/promo-codes/metrics | admin | requireAuth, requireAdmin, anonymous |
| POST | /api/admin/sync-fulfillment | admin | requireAuth, requireAdmin, anonymous |
| GET | /api/auth/me | auth | requireAuth, anonymous |
| GET | /api/designs | auth | requireAuth, anonymous |
| GET | /api/designs/:id | auth | requireAuth, anonymous |
| POST | /api/designs/:id/approve | auth | requireAuth, anonymous |
| POST | /api/designs/clone | auth | requireAuth, anonymous |
| GET | /api/designs/gallery | public | anonymous |
| POST | /api/designs/generate | auth | requireAuth, anonymous |
| POST | /api/designs/generate/guest | public | anonymous |
| GET | /api/designs/random-prompt | public | anonymous |
| POST | /api/gift-codes/purchase | auth | requireAuth, anonymous |
| GET | /api/health | public | checkHealth |
| GET | /api/health/detailed | public | getDetailedHealth |
| GET | /api/orders | auth | requireAuth, anonymous |
| GET | /api/orders/:id | auth | requireAuth, anonymous |
| PATCH | /api/orders/:id/item | auth | requireAuth, anonymous |
| POST | /api/orders/:id/submit-fulfillment | auth | requireAuth, anonymous |
| GET | /api/orders/:id/tracking | auth | requireAuth, anonymous |
| POST | /api/orders/preview | auth | requireAuth, anonymous |
| POST | /api/orders/preview/claim | auth | requireAuth, anonymous |
| POST | /api/orders/preview/guest | public | anonymous |
| POST | /api/payments/confirm-session | auth | requireAuth, anonymous |
| POST | /api/payments/create-checkout-session | auth | requireAuth, anonymous |
| GET | /api/products | public | anonymous |
| GET | /api/products/:id | public | anonymous |
| GET | /api/products/slug/:slug | public | anonymous |
| GET | /api/promo/validate | auth | requireAuth, anonymous |
| POST | /api/webhooks/clerk | public | rawParser, anonymous |
| POST | /api/webhooks/printful | public | jsonParser, anonymous |
| POST | /api/webhooks/stripe | public | rawParser, anonymous |

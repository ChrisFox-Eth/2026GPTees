# Analytics Events (GPTees)

GPTees uses [Vercel Analytics](https://vercel.com/docs/analytics) for automatic page metrics plus custom events fired through `trackEvent` helpers in the React app.

## Naming system

- Format: `<surface>.<action>.<object>` in lowercase dot-case (e.g., `shop.product.open_modal`, `checkout.success.share`).
- Surfaces map to major pages/components (`home`, `pricing`, `shop`, `cart`, `checkout`, `design`, `account`, etc.).
- Actions reuse common verbs (`view`, `load`, `select`, `click`, `start`, `share`, `submit`) to keep dashboards tidy.
- Objects specify the noun being tracked (`cta`, `product`, `option_change`, `payment`, etc.).
- Payload keys are `snake_case`, primitive only (string/number/boolean/null) and trimmed to 255 chars in the helper.
- Include `source_surface` when a single action can fire from multiple places.

## Event catalog

| Event | Trigger | Payload highlights |
| --- | --- | --- |
| `site.page_view` | Route change in SPA router | `path`, `search`, `title_length`, `referrer` |
| `ui.theme.toggle` | Dark/light toggle in header | `theme` |
| `home.hero.cta_click` | Hero buttons (Start Creating, How It Works) | `cta`, `surface` |
| `home.cta.click` | Bottom CTA buttons (Browse Products, View Orders) | `cta`, `surface` |
| `pricing.plan.select` | Pricing card CTA click | `plan_name`, `highlighted` |
| `shop.products.loaded` | Products fetched on shop page | `product_count`, `has_basic` |
| `shop.products.load_error` | Product fetch failure | `message` |
| `shop.product.open_modal` | Product card click opens modal | `product_id`, `product_name`, `base_price`, `color_count`, `size_count`, `source_surface` |
| `shop.product.option_change` | Size/color/tier change in modal | `product_id`, `option_type`, `option_value` |
| `cart.item.add` | Item added to cart (any source) | `product_id`, `product_name`, `tier`, `size`, `color`, `quantity_added`, `quantity_total`, `has_image`, `base_price`, `tier_price` |
| `cart.item.remove` | Remove item from cart | `product_id`, `product_name`, `tier`, `size`, `color`, `quantity_removed`, `remaining_items` |
| `cart.item.quantity_change` | Quantity adjusted | `product_id`, `product_name`, `from`, `to` |
| `cart.clear` | Cart cleared (e.g., post-checkout) | — |
| `cart.checkout.start` | Checkout button click from cart | `item_count`, `subtotal`, `is_signed_in` |
| `checkout.redirect.cart_empty` | Checkout page redirecting empty carts back to cart | — |
| `checkout.payment.start` | Begin Stripe checkout (shipping submitted) | `item_count`, `subtotal`, `country`, `has_state`, `has_phone` |
| `checkout.payment.error` | Stripe session creation failure | `message` |
| `checkout.success.view` | Success page loaded with session + order | `order_id`, `session_id` |
| `checkout.success.confirm_click` | Manual “Confirm Payment” click | `order_id`, `session_id` |
| `checkout.success.confirm_error` | Manual confirm failed | `order_id`, `message` |
| `checkout.success.share` | Share/copy design link from success page | `order_id`, `method` (`web_share`/`clipboard`) |
| `design.gallery.loaded` | Design list fetched for an order | `order_id`, `design_count` |
| `design.page.loaded` | Design generator page ready with order | `order_id`, `status`, `design_tier`, `designs_generated`, `max_designs` |
| `design.prompt.randomized` | “Surprise Me” prompt fetched | `order_id`, `prompt_length`, `style` |
| `design.generate.submit` | Generate design button click | `order_id`, `prompt_length`, `style`, `remaining_designs`, `tier` |
| `design.generate.success` | Design generation completed | `order_id`, `design_id`, `style` |
| `design.approval.submit` | Approve design button click | `order_id`, `design_id` |
| `account.orders.loaded` | Account orders fetched | `order_count` |
| `account.orders.error` | Account orders fetch error | `message` |
| `account.order_detail.loaded` | Order detail view fetched | `order_id`, `status`, `design_count` |
| `account.order_detail.error` | Order detail fetch error | `order_id`, `message` |

## Adding a new event

1. **Pick the name** following `<surface>.<action>.<object>`; confirm it doesn’t already exist via `rg "trackEvent\\(" frontend/src`.
2. **Use the helper**: `import { trackEvent } from '@utils/analytics';`
3. **Fire after state settles** so the event reflects the final state (e.g., after cart mutation or API success).
4. **Keep payloads flat** (primitives only). Reuse canonical keys (`order_id`, `product_id`, `item_count`, `subtotal`, `source_surface`, etc.) and drop `undefined`.
5. **Avoid noisy spam**: debounce fast repeaters or require minimum input length if you add new search fields.
6. **Validate locally**: `npm run dev --prefix frontend`, trigger the action, and check the console network tab for the `track` call in dev.
7. **Deploy + verify**: After pushing, open Vercel → Analytics → Events to confirm the new event appears. Update this catalog when you add new core events.

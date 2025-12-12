# 005 - Product modal conversion stack
- File: `frontend/src/components/ProductModal/ProductModal.tsx`.
- Collapse padding for mobile: change outer modal padding to `className="relative ... w-full p-4 sm:p-6 pb-28"` so the sticky bar has room.
- Add a sticky action bar inside modal for mobile: insert at bottom of modal content (not viewport) a bar with price + CTA:
  ```tsx
  <div className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-gray-500">{deliveryText}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</p>
      </div>
      <Button size="sm" onClick={handleBuyNow}>Buy now</Button>
    </div>
  </div>
  ```
- Size guide + fit note: under the size label add a link `(<button type="button" className="text-xs text-primary-600 underline">View size guide</button>)` that opens a modal or anchors to `/size-guide`.
- Re-order detail stack for faster scanning: heading + price, then size, color, tier, bundle, delivery copy. Set `className="text-sm text-gray-600 ... mb-3"` for delivery text so it sits above selectors.
- Copy tighten: change premium description from “We redraw until you love it�?" to “Unlimited redraws until you approve” (fix encoding).
- Enable Apple/Google Pay prompt: in `handleBuyNow`, after `addToCart`, call `trackEvent('shop.product.buy_now', { ... , payment_request: true })` and surface a note near buttons: `<p className="text-xs text-gray-500 text-center">Apple/Google Pay offered on next step.</p>`.

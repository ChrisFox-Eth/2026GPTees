# 003 - Shop grid mobile spacing + filters
- File: `frontend/src/pages/ShopPage.tsx`.
- Force 2-column grid on small screens for card height control: change the product grid to `className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"` and wrap in `px-2 sm:px-0` to avoid edge clipping.
- Tighten hero copy above the grid: reduce h1 to `text-3xl` on mobile and spacing to `mb-3`; replace the paragraph with a single line and move badges into a single-row scrollable container (`className="-mx-4 px-4 overflow-x-auto"`).
- Filter chips: change the chip row padding to `className="flex gap-2 overflow-x-auto pb-1"` and add icons for categories if available; keep `aria-pressed` for accessibility.
- Move `SocialProofStrip` closer to the grid (margin `mb-4`) and ensure its container uses `className="px-2 sm:px-0"` so it aligns with the cards.
- Add a top-of-list CTA row for mobile: insert a small bar right above the grid:
  ```tsx
  <div className="md:hidden mb-3 flex items-center justify-between px-2">
    <p className="text-xs text-gray-500">From $34.99 • Ships in 5-8 days</p>
    <Button size="sm" variant="secondary" onClick={() => navigate('/checkout')}>Checkout</Button>
  </div>
  ```
- Keep the floating cart summary but reduce padding to `p-3` and font sizes to `text-sm` to avoid covering too much viewport.

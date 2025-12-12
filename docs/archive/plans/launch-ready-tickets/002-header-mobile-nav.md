# 002 - Compact header + slide-out nav polish
- Files: `frontend/src/components/Header/Header.tsx`, `frontend/src/components/Button/Button.tsx` (optional icon padding tweaks).
- Shrink header height: change wrapper to `className="bg-white dark:bg-gray-800 border-b ... sticky top-0 z-[9999]"` but set inner container padding to `className="container-max px-4 py-2 flex ..."` (remove `sm:py-3`) to reduce vertical space on mobile.
- Reduce logo footprint: set the logo block to `className="h-7 w-7"` and the wordmark to `className="text-lg font-bold"` so it doesn’t push nav down.
- Swap mobile Cart/Menu text buttons for compact pills: replace `<Button variant="secondary" size="sm">Cart</Button>` with `className="px-3 py-1.5 text-sm"` and add `ariaLabel` set to “Open cart/menu”. Keep the badge but reduce to `h-4 w-4 text-[10px]`.
- Slide-out nav UX: set the mobile drawer to start below header height by changing `className="fixed top-[64px] right-0 bottom-0 ..."` to `top-[52px]` to match the shorter header; add a footer inside the drawer with inline links:
  ```tsx
  <div className="mt-auto border-t ... pt-3 text-xs text-gray-500">
    <div className="flex justify-between">
      <Link to="/size-guide">Size guide</Link>
      <Link to="/returns">Returns</Link>
    </div>
  </div>
  ```
- Desktop nav spacing: change `gap-6` to `gap-4` and button sizes to `size="sm"` to tighten space; ensure cart button uses `ariaLabel="Open cart"` and leaves enough room for item badge.
- Optional: add `className` prop support on `Button` for icon-only usage (e.g., allow `className="px-3"` without extra padding) by trimming default `px` inside `Button.tsx` when `children` is a single icon; otherwise keep existing API.

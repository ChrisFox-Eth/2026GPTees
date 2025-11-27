# 004 - Product card aspect ratio + quick add
- File: `frontend/src/components/ProductCard/ProductCard.tsx`.
- Normalize imagery: change the wrapper to use `className="aspect-[4/5] ..."` instead of `aspect-square` so tees do not look cramped on mobile; set `<img ... loading="lazy" decoding="async" fetchpriority="low">` and add `sizes="(max-width: 768px) 50vw, 25vw"`.
- Compress copy block: replace `space-y-3` with `space-y-2`, set title to `text-base font-semibold`, and clamp description to 1 line (`line-clamp-1`).
- Quick add CTA: replace the bottom button + price row with a pill bar:
  ```tsx
  <div className="flex items-center justify-between gap-2">
    <div>
      <p className="text-xs text-gray-500">From</p>
      <p className="text-lg font-bold text-primary-600">${startingPrice.toFixed(2)}</p>
    </div>
    <Button size="sm" className="px-3 py-2 text-sm" onClick={onClick}>Quick add</Button>
  </div>
  ```
- Swatch tap targets: change color dots to `className="w-6 h-6 rounded-full border-2 ..."` and wrap in a `button` with `aria-label` for each color so they are accessible and finger-friendly.
- Hover/focus states: add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500` on the card container and ensure `tabIndex={0}` stays for keyboard access.

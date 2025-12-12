# 008 - Performance & LCP for mobile
- Files: `frontend/index.html`, `frontend/src/components/Hero/Hero.tsx`, `frontend/src/components/ProductCard/ProductCard.tsx`, `frontend/src/components/ExamplesGallery/ExamplesGallery.tsx`.
- Preload hero font/primary image: add `<link rel="preload" as="image" href="/og-gptees.png">` and preload the primary font or use `font-display: swap` if custom fonts are added later.
- Set hero image (if added) to `fetchpriority="high"`; for now ensure hero gradient is CSS-only to keep LCP minimal.
- In `ProductCard` and `ExamplesGallery`, add `sizes` attribute and ensure `loading="lazy" decoding="async"` is on all `<img>` tags; enforce `aspect-[4/5]` containers to prevent CLS.
- Remove unused scripts: verify `index.html` only loads `src/main.tsx`; if any third-party placeholders exist, comment or delete before launch.
- Add skeleton shimmer for ExamplesGallery while images load: wrap the map render with a fallback `if (!EXAMPLES.length) return <div className="grid ... animate-pulse">...`.
- Audit bundle size: run `npm run build` and ensure Vite chunking is healthy; if `@vercel/analytics` is tree-shaken, keep, otherwise lazy-load `initAnalytics()` in `App` via `useEffect` to avoid blocking main thread.

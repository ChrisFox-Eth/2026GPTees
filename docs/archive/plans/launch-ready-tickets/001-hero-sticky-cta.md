# 001 - Compress hero + add sticky CTA bar
- Files: `frontend/src/components/Hero/Hero.tsx`, `frontend/src/pages/HomePage.tsx`, add new `frontend/src/components/StickyCtaBar/StickyCtaBar.tsx`.
- Make hero a 1-screen mobile block: change `<section className="pb-12 md:py-20 text-center">` to `className="pt-10 pb-8 md:py-16 text-center container-max px-4"` and reduce h1 sizes to `text-4xl md:text-5xl` with a single-line headline (remove `<br />`).
- Swap long body copy for a 2-line value prop: replace the `<p className="text-xl md:text-2xl ...">` with `className="text-base md:text-lg ... max-w-2xl"` and copy like “Describe it once. We design, you approve, we print.”
- Tighten CTA stack: keep the existing buttons but set wrapper to `className="flex flex-col sm:flex-row gap-3 justify-center mb-8"` and Button sizes to `size="md"` with `className="px-6 py-3 text-base"`.
- Add sticky bottom CTA bar component for mobile only: create `StickyCtaBar` with markup:
  ```tsx
  // frontend/src/components/StickyCtaBar/StickyCtaBar.tsx
  export function StickyCtaBar({ primaryLabel, subcopy, href }: Props) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="container-max px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">{subcopy}</p>
            <p className="text-sm font-semibold text-gray-900">{primaryLabel}</p>
          </div>
          <Button size="sm" onClick={() => window.location.assign(href)}>Shop now</Button>
        </div>
      </div>
    );
  }
  ```
- Mount the sticky CTA on the home page: import and render `<StickyCtaBar primaryLabel="Make a GPTee from $34.99" subcopy="Unlimited redraws before print" href="/shop" />` at the bottom of `HomePage` so it sits outside other sections.

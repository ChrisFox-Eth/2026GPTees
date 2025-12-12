# 010 - QuickStart size/color without clunk
- Files: `frontend/src/components/Quickstart/Quickstart.tsx`, `frontend/src/pages/HomePage.tsx` (anchor already `id="quickstart"`).
- Add compact selectors above the prompt:
  ```tsx
  const [size, setSize] = useState(defaultSize);
  const [color, setColor] = useState(defaultColor);
  ...
  <div className="flex gap-2 flex-wrap text-xs">
    {product.sizes.map((s) => (
      <button key={s} onClick={() => setSize(s)} className={`px-3 py-1.5 rounded-full border ${size === s ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
        {s}
      </button>
    ))}
  </div>
  <div className="flex gap-2 flex-wrap items-center">
    {product.colors.map((c) => (
      <button key={c.name} onClick={() => setColor(c.name)} aria-label={`Choose ${c.name}`} className={`w-8 h-8 rounded-full border-2 ${color === c.name ? 'border-primary-600' : 'border-gray-300'}`} style={{ backgroundColor: c.hex }} />
    ))}
  </div>
  ```
- Use the chosen `size`/`color` in `handleSubmit` payload and in the side summary line.
- Keep UI minimal on mobile: stack selectors with `space-y-3`, clamp prompt to 3 rows, and keep total card width unchanged.
- Tracking: extend `trackEvent('quickstart.submit', { size, color, ... })` to capture new selections.

# 011 - QuickStart style presets + creative suggestions
- Files: `frontend/src/components/Quickstart/Quickstart.tsx`, optionally new `frontend/src/data/style-presets.ts`.
- Add a small “Pick a style” pill row above the textarea:
  ```tsx
  const STYLE_PRESETS = ['Retro surf', 'Minimal line art', 'Neon cyberpunk', 'Vintage anime', 'Bold typographic'];
  ...
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 text-xs">
    {STYLE_PRESETS.map((style) => (
      <button key={style} onClick={() => setPrompt(style)} className={`px-3 py-1.5 rounded-full border ${prompt === style ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
        {style}
      </button>
    ))}
  </div>
  ```
- Add “Auto-generate ideas” chips (e.g., “Birthday gift”, “Band tee”, “Inside joke”) that append to the prompt instead of overwriting; keep to 2 lines max on mobile.
- Include a microcopy line under the prompt: `text-xs text-gray-500` saying “Describe vibe + any text; we handle layout.”
- Tracking: fire `trackEvent('quickstart.style_select', { style })` when a preset is chosen; keep `quickstart.submit` payload unchanged.

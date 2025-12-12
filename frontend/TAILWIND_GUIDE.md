# Tailwind CSS v4 Guide for ReactTemplate

A simple guide to using Tailwind CSS in this project. No fluff, just the essentials.

---

## 🎯 Quick Start

Tailwind is already set up! Just use class names directly in your JSX:

```jsx
<div className="flex items-center justify-center bg-primary-500 text-white p-4 rounded-lg">
  Hello, Tailwind!
</div>
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── index.css          ← Global Tailwind styles (don't touch unless adding custom utilities)
│   ├── components/        ← Your React components
│   └── pages/            ← Your page components
├── tailwind.config.js     ← Theme customization (colors, fonts, etc.)
├── vite.config.ts         ← Vite + Tailwind plugin config
└── postcss.config.js      ← PostCSS config (empty, not needed with Vite)
```

---

## 🎨 Using Custom Colors

Your project has custom color palettes already configured:

### Available Colors

- **primary** - Sky blue (default for buttons, links)
- **secondary** - Purple
- **success** - Green
- **warning** - Amber/Yellow
- **danger** - Red

### How to Use Them

```jsx
// Background colors
<div className="bg-primary-500">Primary</div>
<div className="bg-secondary-600">Secondary</div>
<div className="bg-success-400">Success</div>
<div className="bg-warning-500">Warning</div>
<div className="bg-danger-700">Danger</div>

// Text colors
<p className="text-primary-600">Primary text</p>

// Border colors
<input className="border border-primary-300" />

// Hover states
<button className="bg-primary-600 hover:bg-primary-700">Hover me</button>

// Dark mode
<div className="bg-white dark:bg-gray-900">Adapts to dark mode</div>
```

Each color has shades from 50 (lightest) to 900 (darkest).

---

## 🔧 Common Tailwind Classes

### Layout

```jsx
// Flexbox
<div className="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

// Grid
<div className="grid grid-cols-3 gap-4">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

// Spacing (padding & margin)
<div className="p-4 m-2">Padding 4, Margin 2</div>
<div className="px-6 py-2">Horizontal padding 6, vertical 2</div>
```

### Typography

```jsx
// Font sizes (configured in tailwind.config.js)
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Normal text</p>
<small className="text-xs">Small text</small>

// Font weights
<p className="font-light">Light</p>
<p className="font-normal">Normal</p>
<p className="font-bold">Bold</p>
```

### Sizing

```jsx
// Width & Height
<div className="w-full h-screen">Full width and height</div>
<div className="w-64 h-32">Fixed size</div>

// Min/Max
<div className="min-h-screen">At least full height</div>
<div className="max-w-2xl">Max width</div>
```

### Borders & Shadows

```jsx
// Borders
<div className="border border-gray-300">1px border</div>
<div className="border-2 border-primary-500">2px primary border</div>
<div className="rounded-lg">Rounded corners</div>

// Shadows
<div className="shadow-sm">Small shadow</div>
<div className="shadow-lg">Large shadow</div>
```

---

## 🎭 Responsive Design

Use breakpoints to change styles at different screen sizes:

```jsx
<div className="text-sm md:text-base lg:text-lg">
  Small on mobile, medium on tablet, large on desktop
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid: 1 column mobile, 2 on tablet, 3 on desktop
</div>
```

**Breakpoints:**
- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px

---

## 🌙 Dark Mode

Your project supports dark mode! Just add the `dark:` prefix:

```jsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Adapts to light/dark mode
</div>

<button className="bg-primary-600 dark:bg-primary-700">
  Button
</button>
```

---

## 🎯 Hover, Focus & Other States

```jsx
// Hover
<button className="bg-primary-600 hover:bg-primary-700">Hover me</button>

// Focus (for accessibility)
<input className="focus-visible:outline-primary-500" />

// Active
<button className="active:scale-95">Click me</button>

// Disabled
<button disabled className="disabled:opacity-50 disabled:cursor-not-allowed">
  Disabled
</button>

// Group hover (parent hover affects children)
<div className="group">
  <div className="group-hover:text-primary-500">Changes on parent hover</div>
</div>
```

---

## 📝 Custom Utilities

Custom utilities are defined in `src/index.css`. They're already available:

```jsx
// Flex center - centers content both horizontally and vertically
<div className="flex-center">
  Centered content
</div>

// Screen reader only - hidden visually but readable by screen readers
<span className="sr-only">Hidden from view</span>
```

---

## ⚠️ Important Rules

### ✅ DO

- Use Tailwind classes directly in JSX
- Combine multiple classes: `className="flex items-center gap-4 p-4"`
- Use responsive prefixes: `md:text-lg lg:text-xl`
- Use state variants: `hover:bg-primary-700 focus:outline-primary-500`

### ❌ DON'T

- Don't write custom CSS unless absolutely necessary
- Don't use inline styles when Tailwind can do it
- Don't hardcode colors - use the theme colors
- Don't use `@layer utilities` in component files - add to `src/index.css` only

---

## 🔍 Debugging

### Classes not working?

1. **Check spelling** - Tailwind is case-sensitive
2. **Check the class exists** - Use autocomplete in your editor
3. **Check specificity** - Tailwind classes might be overridden by other CSS
4. **Restart dev server** - Sometimes Vite needs a refresh: `npm run dev`

### Want to see all available classes?

Visit [Tailwind CSS Docs](https://tailwindcss.com/docs) or use your editor's IntelliSense.

---

## 🚀 Adding New Theme Colors

If you need to add a new color to the theme:

1. Open `tailwind.config.js`
2. Add to the `colors` object in `theme.extend`:

```javascript
colors: {
  // ... existing colors
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... add all shades 50-900
    500: '#0ea5e9',
    // ...
  },
}
```

3. Use it: `className="bg-brand-500"`

---

## 📚 Quick Reference

| Task | Example |
|------|---------|
| Center content | `className="flex items-center justify-center"` |
| Add spacing | `className="p-4 m-2"` |
| Responsive text | `className="text-sm md:text-lg"` |
| Button style | `className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"` |
| Dark mode | `className="bg-white dark:bg-gray-900"` |
| Hover effect | `className="hover:shadow-lg transition"` |
| Disabled state | `className="disabled:opacity-50"` |

---

## 🆘 Need Help?

- **Official Docs**: https://tailwindcss.com/docs
- **IntelliSense**: Your editor should autocomplete Tailwind classes
- **Color Picker**: https://tailwindcss.com/docs/customizing-colors

Happy styling! 🎨

---

## 📜 CSS Policy (Global Only)

**All CSS must live in `src/index.css`**. No component-level CSS files.

### What belongs in `index.css`

| Section | Purpose | Examples |
|---------|---------|----------|
| `@layer base` | HTML element resets & defaults | `html`, `body`, `:focus-visible` |
| `@layer components` | Reusable global utilities | `container-max`, `transition-smooth`, `btn-pulse-gradient` |
| `@utility` | Custom Tailwind utilities | `sr-only`, `flex-center` |
| `@keyframes` | Animations used by global styles | `wigglePulse` |

### Rules

1. **No component-specific CSS files** - Use Tailwind classes or CVA variants
2. **No `@apply` in components** - Compose classes in JSX via `cn()`
3. **New utilities go in `index.css`** - Add with justification in a comment
4. **Complex animations stay global** - Define keyframes once, reference via class

### When to add to `index.css`

- A utility is used in 3+ unrelated components
- An animation/keyframe is complex enough to warrant named abstraction
- A base style needs to apply globally (e.g., focus rings)

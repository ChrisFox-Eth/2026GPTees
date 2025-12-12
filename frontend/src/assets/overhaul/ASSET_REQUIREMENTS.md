# GPTees Visual Asset Requirements

This document defines the imagery and asset needs for the editorial fashion-brand presentation.

## Style Guidelines (ALL ASSETS)

- **Contemporary fashion**, not techy. No futuristic/robot/AI motifs.
- **Warm neutrals**, natural lighting, soft shadows.
- **Avoid** stock-photo "startup energy" or forced diversity shots.
- **Consistent aspect ratios** for grids (16:9 for hero, 4:5 for lookbook).
- **Color palette alignment**: warm off-whites (#F7F5F2), soft shadows, cobalt (#2F6BFF) accents sparingly.

---

## 1. Hero Lifestyle Images

**Location:** `hero/`
**Usage:** Full-bleed or near full-bleed on HomePage Hero section
**Quantity:** 1-2 images
**Aspect Ratio:** 16:9 (desktop), 9:16 or 3:4 crop for mobile
**File Format:** WebP preferred, JPG fallback
**Dimensions:** 1920x1080 minimum (will be responsive)

### Image 1: `hero-lifestyle-01.webp`

**Plain English Description:**
A person wearing a custom-printed t-shirt in a warm, naturally-lit environment. The focus is on the shirt design - perhaps they're looking down at it or it's prominently featured. Background is minimal - maybe a clean studio, sunlit room, or simple outdoor setting. Warm tones, soft shadows, editorial fashion photography style. The person should look relaxed and confident, not posed artificially.

**Image Generation Prompt:**
```
Editorial fashion photography, person wearing a custom graphic t-shirt, warm natural lighting, soft shadows, clean minimal background, warm neutral tones, shot on medium format camera, shallow depth of field focusing on the shirt design, contemporary fashion lookbook style, no text overlays, professional studio lighting with natural feel
```

### Image 2: `hero-lifestyle-02.webp` (Optional alternate)

**Plain English Description:**
Close-up detail shot of a t-shirt's print quality and fabric texture. Shows the premium quality of the printing without showing a full person. Warm lighting, perhaps draped over something or being held. Emphasizes craftsmanship.

**Image Generation Prompt:**
```
Close-up detail shot of custom printed t-shirt fabric, premium cotton texture visible, warm natural lighting, soft focus background, editorial product photography, warm neutral tones, emphasis on print quality and fabric softness, contemporary fashion catalog style, no text
```

---

## 2. Lookbook / Examples Gallery

**Location:** `lookbook/`
**Usage:** ExamplesGallery grid on HomePage
**Quantity:** 6-12 images
**Aspect Ratio:** 4:5 (portrait, Instagram-style)
**File Format:** WebP preferred, JPG fallback
**Dimensions:** 800x1000 minimum

### Lookbook Images (`lookbook-01.webp` through `lookbook-12.webp`)

**Plain English Description:**
A collection of lifestyle shots showing various custom t-shirt designs being worn. Mix of:
- Full body shots (person walking, standing casually)
- Half body shots (waist up)
- Detail shots (print close-ups on body)

Each should feature a different design aesthetic - some bold graphics, some minimal text, some artistic illustrations. Diverse settings but all with the same warm, editorial photography style.

**Image Generation Prompts:**

```
# Lookbook 01 - Bold graphic tee
Person wearing bold graphic t-shirt, urban setting, warm afternoon light, candid pose, editorial fashion photography, 4:5 aspect ratio, contemporary streetwear catalog, warm color grading

# Lookbook 02 - Minimal text tee
Person in minimal text t-shirt, clean studio background, soft diffused lighting, relaxed confident pose, fashion lookbook style, warm neutral tones, 4:5 portrait

# Lookbook 03 - Artistic illustration tee
Person wearing artistic illustrated t-shirt, indoor setting with natural window light, contemporary fashion editorial, soft shadows, 4:5 format, warm undertones

# Lookbook 04 - Print detail on body
Close-up of t-shirt print on person's torso, soft focus face/background, emphasis on design quality, editorial detail shot, 4:5 ratio, warm lighting

# Lookbook 05 - Lifestyle outdoor
Person in custom tee walking outdoors, golden hour lighting, candid movement, contemporary fashion photography, warm tones, 4:5 portrait orientation

# Lookbook 06 - Seated casual
Person seated wearing graphic tee, minimal furniture, soft studio lighting, relaxed pose, fashion catalog style, 4:5 aspect, warm neutrals
```

---

## 3. Fabric/Print Detail Shots

**Location:** `mockups/` (subfolder `details/`)
**Usage:** Trust-building detail sections, potentially ProductModal
**Quantity:** 2-3 images
**Aspect Ratio:** 1:1 or 4:3
**File Format:** WebP preferred
**Dimensions:** 600x600 minimum

### Detail Images

**Plain English Description:**
Extreme close-ups showing:
1. The weave/texture of the cotton fabric
2. The print quality - how ink sits on fabric
3. The stitching quality on collar/hem

These build trust in product quality without showing the full product.

**Image Generation Prompts:**

```
# Fabric texture detail
Extreme macro close-up of premium cotton t-shirt fabric texture, soft natural lighting, showing thread weave pattern, warm white cotton, product photography style, no text

# Print quality detail
Macro shot of DTG print on cotton fabric, showing ink saturation and detail clarity, soft lighting, premium quality print, editorial product detail

# Stitching detail
Close-up of t-shirt collar stitching, premium construction visible, soft focus background, warm lighting, quality craft detail shot
```

---

## 4. Product Neutral Mockups

**Location:** `mockups/`
**Usage:** ProductCard, ProductModal, Shop page
**Quantity:** 4 (one per core color)
**Aspect Ratio:** 4:5
**File Format:** PNG with transparency OR WebP on neutral background
**Dimensions:** 800x1000 minimum

### Color Mockups

**Plain English Description:**
Clean, flat-lay or ghost mannequin style shots of blank t-shirts in each core color:
- Black (#0b0b0b)
- Gray (#3E3C3D)
- Navy (#212642)
- White (#FFFFFF)

Professional product photography, consistent lighting across all, neutral background that works with our warm paper (#F7F5F2) palette.

**Image Generation Prompts:**

```
# Black tee mockup
Professional product photography of black cotton t-shirt, flat lay or ghost mannequin, clean neutral background, soft even lighting, no wrinkles, premium apparel catalog style, 4:5 aspect ratio

# (Repeat for Gray, Navy, White with color adjustments)
```

---

## 5. Subtle Texture Overlays

**Location:** `textures/`
**Usage:** Background texture on sections (Pricing, CTA, etc.)
**Quantity:** 2-4 variations
**Aspect Ratio:** Tileable/seamless
**File Format:** PNG with transparency
**Dimensions:** 400x400 tileable pattern
**Opacity when used:** 2-4%

### Texture Files

**Plain English Description:**
Very subtle paper/grain textures that add warmth without being noticeable. Should tile seamlessly.

1. `grain-light.png` - Light paper grain for light backgrounds
2. `grain-dark.png` - Subtle grain for dark mode
3. `paper-texture.png` - Warm paper texture
4. `noise-subtle.png` - Very fine noise pattern

**Image Generation Prompts:**

```
# Light grain texture
Seamless tileable paper grain texture, very subtle, warm off-white base, 2-4% visible grain, high resolution, clean edges for tiling

# Paper texture
Seamless warm paper texture, subtle fiber pattern, cream/off-white base, tileable 400x400, very low contrast grain
```

---

## Placement Map

| Asset | Component | Notes |
|-------|-----------|-------|
| hero-lifestyle-01.webp | Hero.tsx | Full-bleed background or large feature |
| lookbook-*.webp | ExamplesGallery.tsx | Grid of 6-12 images |
| mockups/*.webp | ProductCard.tsx, ProductModal.tsx | Product display |
| details/*.webp | ProductModal.tsx or trust section | Quality proof |
| textures/*.png | PricingSection.tsx, CallToAction.tsx | 2-4% opacity overlay |

---

## Temporary Placeholders

Until final photography is ready, use:
- Solid color blocks matching the palette
- Aspect-ratio placeholder divs with subtle borders
- Text indicating "Image coming soon" in muted color

The layout should be fully responsive and ready to swap in final assets.

---

## File Naming Convention

```
hero-lifestyle-01.webp
hero-lifestyle-02.webp
lookbook-01.webp
lookbook-02.webp
...
mockup-black.webp
mockup-gray.webp
mockup-navy.webp
mockup-white.webp
texture-grain-light.png
texture-grain-dark.png
texture-paper.png
```

All lowercase, hyphens for spaces, numbered sequentially.

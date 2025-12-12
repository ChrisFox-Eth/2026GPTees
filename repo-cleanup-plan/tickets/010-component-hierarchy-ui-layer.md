# Ticket 010 — Frontend Component Hierarchy + UI Layer

**Goal:** Reorganize `frontend/src/components/` into a clearer hierarchy with `ui/` primitives and feature/section buckets.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Completion Log
- Created 4 category folders: `ui/`, `sections/`, `product/`, `motion/`
- Moved 11 primitives to `ui/` (Alert, Badge, Button, Card, Grid, Input, LoadingSpinner, Modal, Table, Tabs, Toast)
- Moved 13 section components to `sections/` (Header, Footer, Hero, etc.)
- Moved 2 product components to `product/` (ProductCard, ProductModal)
- Moved 5 motion components to `motion/` (MotionFadeIn, etc.)
- Created barrel exports (`index.ts`) for each category
- Updated all imports across 20+ page/component files
- Type-check passes

## Why
- Current flat folder list is large and hard to scan.
- A UI layer clarifies reuse vs feature‑specific components.

## Scope
- Create new structure:
  - `frontend/src/components/ui/` — primitives (Button, Card, Input, etc.).
  - `frontend/src/components/sections/` or `frontend/src/components/features/` — larger feature components (Hero, PricingSection, Quickstart, etc.).
  - Optional: `frontend/src/components/layout/` — Header/Footer/Grid/etc if preferred.
- Move files and update imports app‑wide.

## Out of scope
- Backend reorg.
- Styling changes beyond path updates.

## Proposed mapping (initial)
**To `ui/`:**
- Alert, Badge, Button, Card, Grid, Input, LoadingSpinner, Modal, Tabs, Table, Toast, ProtectedRoute.

**To `sections/` or `features/`:**
- Hero, Header, Footer, PricingSection, ProductCard, ProductModal, Quickstart, SocialProofStrip, CallToAction, HowItWorks, Gallery, Features, ExamplesGallery, StickyCtaBar, AnimationGallery, Motion* components.

## Implementation steps
1. Decide final bucket names (`sections` vs `features` vs `layout`).
2. Create folders and move primitives first.
3. Move feature components next.
4. Update imports:
   - Prefer barrel exports for `ui` to keep paths short.
5. Run TS build to catch missed paths.

## Deliverables
- New component hierarchy with clean imports.

## Acceptance criteria
- `frontend/src/components/` is easy to scan by category.
- No broken imports; app builds.

## Risks / mitigations
- **Risk:** Big path churn creates merge conflicts.  
  **Mitigation:** Land this after styling/types sweeps to avoid overlapping diffs.


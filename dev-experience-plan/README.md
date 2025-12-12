# GPTees Dev Experience / Truthful Docs Plan

**Purpose:** Make it fast and accurate to understand GPTees core flows (design creation, ordering, conversion) by adding auto-generated, runtime-derived artifacts that cannot silently drift.

Tickets live in `dev-experience-plan/tickets/` and are ordered to build foundations first, then enforce consistency.

## Ticket index (ordered)
1. `001-runtime-route-manifest.md` — Runtime-derived API route manifest (method/path/auth).
2. `002-order-design-state-machine.md` — Single source of truth for order/design status semantics and allowed actions.
3. `003-analytics-event-catalog.md` — Typed event catalog + generator to keep docs in sync.

## Notes
- Prefer **generated artifacts** over manual docs when possible.
- Avoid breaking existing analytics dashboards by renaming event strings unless explicitly planned.

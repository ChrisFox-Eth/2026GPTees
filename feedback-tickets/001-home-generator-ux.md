# Home generator UX alignment

## Goal
Move the "Try it" prompt entry to the most intuitive spot and reduce redirect confusion when starting a tee.

## Tasks
- [ ] Update `frontend/src/components/Hero/Hero.tsx` CTA so the primary button scrolls/jumps to the generator instead of navigating away; keep Gift CTA unchanged.
- [ ] Reorder `frontend/src/components/Quickstart/Quickstart.tsx` controls so size and color appear below the prompt input, with "Try it"/prompt area positioned immediately under the "Your prompt" label.
- [ ] Adjust supporting copy in Quickstart to align with the new layout and make the entry point obvious for first-time users.
- [ ] Verify mobile spacing after the move to keep controls readable without excess scrolling.

# ADR 0018: Performance budget for the first patient route

Status: accepted

## Context

Section 15 (F10) sets a budget of 200 KB gzipped for the first patient route, with lazy routes per area.

## Decision

`scripts/bundle-budget.mjs` reads the Vite build manifest, follows the entry and the sign-in screen chunk with all their static imports and CSS, gzips them and fails above 200 KB. It also fails if staff or admin feature code is reachable from that set. It runs at the end of `npm run check`.

`package.json` declares `sideEffects` (CSS and `src/main.tsx` only) so unused modules behind the `@/ui` barrel, such as `SafeHtml` and DOMPurify, are dropped. At the time of writing the first route is about 190 KB.

## Consequences

The largest remaining costs are React, the router, TanStack Query and Zod (the namespace import keeps all of Zod). If the budget gets tight, the next steps are loading repositories and their schemas per area, or moving the DTOs to `zod/mini`; either needs its own ADR.

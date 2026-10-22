# Folio EHR web (frontend)

Frontend for a multi-hospital EHR: patient portal (`/portal`), clinician workspace (`/staff`) and admin console (`/admin`). The backend does not exist yet; the frontend builds against its own draft API contract and an MSW mock server.

## Read first, in this order

1. `docs/codebase.md`: architecture, rules, stack, build phases. This is the source of truth for how to build.
2. `docs/HANDOFF.md`: screens, flows, design tokens, data model. This is the source of truth for what to build.
3. `docs/design/*.dc.html`: one design file per screen (IDs P1 to P9, C1 to C9, A1 to A4). Match layout, copy, spacing and states exactly. The `<script type="text/x-dc">` block holds sample data and UI behavior; use it as reference, do not copy the runtime code.
4. `docs/KICKOFF.md`: the prompt for each phase.

If two documents disagree, `docs/codebase.md` wins on architecture and `docs/design/` wins on visuals and copy. If something is still unclear, use the defaults in `docs/codebase.md` section 16 and note the assumption in the PR.

## Commands (available after phase F0)

- `npm run dev:mock`: app with the mock backend
- `npm run check`: typecheck, lint, format check, architecture rules, unit tests, build (must pass before every PR)
- `npm run e2e`: Playwright end-to-end flows

## Non-negotiable rules

- Work one phase per session (`docs/codebase.md` section 15). Do not start the next phase in the same branch.
- No patient data in browser storage, URLs, logs or third-party scripts (section 3).
- Every request and query key is scoped by organization and facility (section 4). Use `scopedKeys`.
- Layer imports follow section 6; `npm run arch` enforces it.
- Scheduling and display times use the facility time zone, never the browser's.
- Result flags and statuses are never shown by color alone.
- All UI strings go through `t()` from `src/i18n/en.ts`.
- Sample data is fictional (names from the designs). Never add real patient data.
- No em dashes or en dashes in code comments, docs, commit messages or UI copy.
- No new dependencies beyond `docs/codebase.md` section 2 without an ADR in `docs/adr/`.

## Git and PRs

- Branch per phase: `phase/f0-scaffold`, `phase/f1-kernel-shells`, and so on.
- Commit messages: `feat(booking): doctor search and category filter (P5)`. Name the screen IDs.
- Open one PR per phase. The description lists: screens done, exit criteria from section 15 with a pass or fail for each, assumptions made, and anything left for the next phase.
- Attach or describe screenshots at 1440px and 390px for every screen touched.

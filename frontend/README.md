# Folio EHR web

Frontend for a multi-hospital EHR: the patient portal (`/portal`), the clinician workspace (`/staff`) and the admin console (`/admin`). The backend does not exist yet, so the app is built against its own API contract (`api/openapi.yaml`) and an MSW mock server that enforces the same rules.

The specs live in `../design-files/docs/`: `codebase.md` (architecture and rules), `HANDOFF.md` (screens and flows) and `design/*.dc.html` (one design per screen).

## Requirements

Node 22 (see `.nvmrc`). Install with `npm ci`.

## Commands

| Command                   | What it does                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | App against a real API at `VITE_API_BASE` (default `/api`, proxied to `API_PROXY_TARGET`, default `http://localhost:8080`).                                                     |
| `npm run dev:mock`        | App with the mock API running in the browser (MSW). Use this until the backend exists.                                                                                          |
| `npm run check`           | Everything a pull request must pass: typecheck, lint, format check, architecture rules (`npm run arch`), unit and component tests, production build and the performance budget. |
| `npm run e2e`             | Playwright end-to-end flows against a mock build served on port 4173. Run `npx playwright install chromium` once first.                                                         |
| `npm run test`            | Vitest in watch mode.                                                                                                                                                           |
| `npm run coverage`        | Tests with coverage thresholds (domain 95% lines, application 90%).                                                                                                             |
| `npm run budget`          | Gzipped size of the first patient route, after `vite build` (budget 200 KB).                                                                                                    |
| `npm run contract:update` | Regenerates `api/openapi.yaml` from the endpoint registry and re-validates every example against its schema. Run it after changing a DTO.                                       |
| `npm run preview:mock`    | Production-like mock build on http://localhost:4173.                                                                                                                            |

## Trying the mock

`npm run dev:mock`, then sign in with any password of four or more characters:

| Who                        | Sign in as     | Email                             |
| -------------------------- | -------------- | --------------------------------- |
| Patient                    | Patient        | `ramesh.pandey@mail.com`          |
| Clinician (two facilities) | Hospital staff | `anaya.shrestha@northvale.health` |
| Facility admin             | Hospital staff | `sarita.joshi@northvale.health`   |

The mock clock starts at Tuesday 20 October 2026, 14:20 in Kathmandu (`src/infrastructure/mock/seed/time.ts`), so the sample data matches the designs. All names and records are fictional and come from the designs.

The mock database lives in the page: a reload resets it.

## Layout

```
src/
  core/            result, errors, branded ids, clock, logger (no React, no I/O)
  domain/          pure rules: scheduling, appointments, packages, labs, medications, identity
  application/     ports (interfaces) and use cases
  infrastructure/  http client, API repositories and DTOs, mock server, realtime, printer, storage
  i18n/            every UI string (t()) and Intl formatting in the facility zone
  ui/              design-system primitives, no domain knowledge
  features/        one folder per screen or flow, public API through index.ts
  app/             composition root, router, shells, session, tenancy, chart layout
e2e/               Playwright flows 1 to 8, keyboard-only pass, PHI guard fixture
scripts/           bundle budget
docs/              ARCHITECTURE.md, ADRs, INVARIANTS.md
```

`npm run arch` enforces the import rules between these layers (`.dependency-cruiser.cjs`).

## Rules that are easy to break

- No patient data in browser storage, URLs, logs or third-party scripts. Search text goes in the `X-Search` header (ADR 0016). The e2e PHI guard fails a test that leaks a seeded name or MRN into a URL.
- Every request and query key carries the organization and facility (`scopedKeys`, tenant headers).
- Times are shown in the facility time zone, never the browser's.
- Result flags are never color alone.
- Every UI string goes through `t()`.
- Signing a note, an order or a refill decision confirms with the patient name and MRN (ADR 0017).

`docs/INVARIANTS.md` lists each invariant from `codebase.md` section 1 with the tests that cover it.

## Screens

| Area                | Screens                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Patient portal      | P1 sign in, P2 register, P3 password reset, P4 home, P5 book, P6 packages, P7 appointments, P8 lab reports, P9 medicines             |
| Clinician workspace | C1 workspace, C2 today, C3 patients, C4 clinic schedule, C5 chart summary, C6 note, C7 lab order, C8 results, C9 medication requests |
| Admin console       | A1 appointment blocks, A2 leave and blocked time, A3 consultation packages, A4 facilities and access                                 |

## Known gaps

- Prices and fees are placeholders (`[PACKAGE PRICE]`, `[ON-SITE FEE]`) as in the designs; there is no payment flow.
- SSO on the sign-in screen is a link only; there is no identity provider in the mock.
- C6 has no coding panel (the designs show static ICD codes with no source), and the C3 "Whole facility" scope is not offered because the mock only has one ward.
- P8 has no "Message your care team" link because messaging is not part of this build.

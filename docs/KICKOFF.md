# Kickoff prompts for Claude Code on the web

Start one Claude Code session per phase, on this repository, in order. Wait for each phase's PR to be reviewed and merged before starting the next. Paste the prompt for the phase as the first message of the session.

Every prompt assumes Claude Code reads `CLAUDE.md` automatically. Each prompt below is complete; copy the quoted block as is.

---

## F0: Scaffold and tooling

> Phase F0. Read CLAUDE.md and docs/codebase.md in full. Scaffold the app exactly as sections 2, 5, 6 and 7 describe: Vite, React, TypeScript with the strict tsconfig, ESLint flat config, Prettier, Vitest, Playwright, dependency-cruiser, the npm scripts, `.nvmrc`, `engines`, `.gitignore`, and the CI workflow. Install the latest stable version of each package with npm; do not pin versions from memory. Self-host IBM Plex Sans and IBM Plex Mono in `public/fonts`. Create `src/styles/tokens.css` from the token table in docs/HANDOFF.md. Create the empty folder structure from section 5 with an `index.ts` placeholder per feature. Write `docs/ARCHITECTURE.md` (one page) and one ADR per row of section 16. The app should render a placeholder page. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F1: Kernel, session, tenancy, shells, design system

> Phase F1. Read docs/codebase.md sections 3, 4, 8, 10.1, 10.2, 10.5, 12.3, 13.3, 13.4 and 13.5, and docs/HANDOFF.md "Layout shells". Build `src/core`, the HTTP client and interceptors, `SessionProvider`, `IdleLock` (staff 10 minutes, patients 15, with an injected Clock), `TenantProvider`, `scopedKeys`, `createServices` and `ServicesProvider`, the i18n catalog and `t()`, every primitive in section 13.4 with a vitest-axe test, and the four shells (AuthShell, PortalShell, StaffShell, AdminShell) matching docs/design (use Main.dc.html, PtHome.dc.html, Dashboard.dc.html and AdminAvail.dc.html for the shells). Include the tests listed in section 14 for idle lock, facility switch and storage. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F2: Contract and mock backend

> Phase F2. Read docs/codebase.md sections 9, 10.3 and 10.4, and docs/HANDOFF.md "Data model". Write `api/openapi.yaml` for every endpoint group in section 9, with examples. Write the Zod DTOs, mappers and repositories in `src/infrastructure/api`, the SSE adapter, and the MSW mock in `src/infrastructure/mock` with an in-memory db seeded from the sample data in docs/design (patients, practitioners, availability blocks, time off, appointments, packages, lab results, medication requests). The mock must enforce scheduling rules, cancellation window, refill transitions and tenant scoping. Add the contract test that validates every OpenAPI example against its Zod schema. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F3: Access (P1, P2, P3, C1)

> Phase F3. Build P1 sign in (Patient and Staff toggle), P2 registration (details, verify, done), P3 forgot password (three steps) and C1 facility selection, matching Main.dc.html, Register.dc.html, Forgot.dc.html and Workspace.dc.html. Include route guards from section 13.1, use cases from section 12.2, and e2e flow 1 from docs/HANDOFF.md "Core flows". Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F4: Admin scheduling (A1, A2)

> Phase F4. Build the scheduling domain module (section 11.2 and 11.5: `checkSlot`, `dayStatus`, `blockSlotCount`, `weeklySummary`, time zone helpers with tests in Asia/Kathmandu and a DST zone), then A1 appointment blocks and A2 leave and blocked time, matching AdminAvail.dc.html and AdminLeave.dc.html, including booking rules, the impact preview and the required handling choice. Add e2e flows 5 and 6. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F5: Booking and appointments (P5, P7, C4, P4 next appointment)

> Phase F5. Build P5 find a doctor and book (search by name or concern, category chips with counts, on-site or remote step, date strip using `dayStatus`, slots, confirm, booked), P7 my appointments with the cancel dialog and Undo, C4 clinic schedule, and the next-appointment card on P4, matching Book.dc.html, Appointments.dc.html, Schedule.dc.html and PtHome.dc.html. Implement the `bookingFlow` and `appointmentStatus` state machines with transition-table tests. Add e2e flows 2 and 3, and a test that leave days show as "On leave" in P5. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F6: Consultation packages (A3, P6)

> Phase F6. Build A3 package editor with live preview and P6 browse, search, filter and book a package, matching AdminPackages.dc.html and Packages.dc.html. The preview in A3 must render the same `PackageCard` exported by the P6 feature. Implement the `packageFormats` strategy (hybrid books the first visit on-site) and the `packageBookingFlow` machine. Add e2e flow 4. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F7: Clinical (C5, C6, C7, C8, P8)

> Phase F7. Build the chart layout route with the patient banner, C5 chart summary, C6 consultation note, C7 lab order, C8 results inbox and review with the trend chart, and P8 patient lab reports, matching Chart.dc.html, Note.dc.html, Orders.dc.html, Results.dc.html and PtResults.dc.html. Implement `noteStatus`, `labResultReview` and `labFlagRules`, realtime critical results with a persistent banner, and release to the patient portal. Add e2e flow 7. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F8: Medicines (P9, C9)

> Phase F8. Build P9 medicines with the refill request and progress, and C9 medication requests with approve, change dose or decline, matching PtMeds.dc.html and Requests.dc.html. Implement the `refillRequest` machine and `refillSafetyChecks` (each check a pure function with a test); approving with a fired check needs a second confirmation that names it. Add e2e flow 8. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F9: Dashboards and organization (P4, C2, C3, A4)

> Phase F9. Finish P4 patient home, C2 today, C3 patients and A4 facilities and access, matching PtHome.dc.html, Dashboard.dc.html, Patients.dc.html and Admin.dc.html. Then review all 22 screens against their design files at 1440px and 390px and fix differences, and make sure every list and form has loading, empty and error states. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

## F10: Hardening

> Phase F10. Do everything in docs/codebase.md section 15, F10: performance budget and lazy routes per area, print views with the PHI footer, keyboard-only pass of booking, cancellation and refill decision, vitest-axe on every screen, the PHI storage test across all e2e flows, and an ADR review. Confirm every invariant in section 1 has a test and list them in the PR with the test name. Update the README. Work on a new branch named as in CLAUDE.md. Run `npm run check` until it passes. Open a PR whose description lists each exit criterion for this phase from docs/codebase.md section 15 with pass or fail, the assumptions you made, and what is left for the next phase.

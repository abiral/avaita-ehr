# codebase.md: Folio EHR frontend architecture, setup and build plan

Audience: Claude Code, working in a new repository `folio-ehr-web`.
Companion files: `docs/HANDOFF.md` (screens, flows, design tokens, data model) and `docs/design/*.dc.html` (one design file per screen). Read both first.

Goal: build the Folio EHR web frontend (patient portal, clinician workspace, admin console) as a strictly typed React application with a layered design, built for many hospitals from day one, safe for health data, and matching the designs exactly.

Scope: **frontend only.** The backend API does not exist yet. The frontend owns a draft API contract and a mock server (section 9) so every screen can be built and tested now, then pointed at the real API later without touching features.

---

## 0. Rules of engagement

1. **Designs are the spec.** Match layout, copy, spacing, colors and interaction states in `docs/design/*.dc.html`. The `<script type="text/x-dc">` block in each file holds that screen's sample data and UI state logic; use it as a behavior reference, not as code to copy.
2. **Strict from day one.** No `allowJs`, no gradual typing, no lint warnings left as warnings. This is a new codebase.
3. **Health data is sensitive by default.** Every rule in section 3 is mandatory. When unsure whether something is patient data, treat it as patient data.
4. **Every server read and write is scoped to a tenant** (organization and facility). No exceptions, including caches (section 4).
5. **Small PRs.** One feature slice or one cross-cutting concern per PR. Commit messages name the screen or flow: `feat(booking): doctor search and category filter (P5)`.
6. **No new libraries** beyond section 2 without a short ADR in `docs/adr/`.
7. **No over-engineering.** Prefer functions and plain interfaces to classes. No DI framework, no decorators, no abstract base classes. Use a pattern only where this file names it or where it removes a real branch chain.
8. **Ask only when blocked.** Defaults for open decisions are in section 16; use them unless the owner says otherwise.
9. **Generated documents, comments and UI copy must not contain em dashes or en dashes** (use commas, colons, hyphens or parentheses).

---

## 1. Product areas and invariants

Three areas in one app, each with its own shell (see `HANDOFF.md`, Layout shells):

| Area | Users | Route prefix | Primary device |
|---|---|---|---|
| Patient portal | Patients | `/portal` | Phone first |
| Clinician workspace | Doctors, nurses, front desk, lab, pharmacy | `/staff` | Desktop first, usable at 768px |
| Admin console | Facility and organization admins | `/admin` | Desktop first, usable at 768px |

Invariants (each needs an automated test, section 14):

Access and session
- Patients and staff sign in on the same screen with a Patient or Staff toggle (P1). Staff land on facility selection (C1) unless they have exactly one facility.
- A staff session locks after **10 minutes** of inactivity, a patient session after **15**. The lock screen keeps the URL and asks for the password (or SSO) again. Unsaved form drafts survive the lock in memory only.
- Any 401 returns the user to sign in (or the lock screen for staff) with the current URL as `returnTo`.
- Sign out, lock-screen timeout after 30 minutes locked, and facility switch all clear the entire query cache and all in-memory drafts.

Tenancy
- The active `organizationId` and `facilityId` are part of every request and every query key.
- A user only sees facilities they hold a membership in. Permissions are per facility.

Clinical safety
- Every chart screen (C5 to C8) shows the patient banner: full name, age and sex, MRN, allergies. Two identifiers are always visible before any action that writes to a patient record.
- Signing an order, a note or a refill decision shows the patient name and MRN in the confirm control.
- Abnormal and critical results are never shown by color alone: the flag text (`H`, `L`, `Critical`) and units are always present.
- Critical results reach the clinician without a page refresh (server-sent events, section 10.4) and stay flagged until acknowledged.

Scheduling
- Patients can only book slots inside a practitioner's availability blocks, outside time off, respecting booking rules (max days ahead, minimum notice).
- Days fully covered by time off show as "On leave" in booking (P5).
- On-site and remote are separate modes. A mode the practitioner does not offer is shown disabled with the reason.
- Displayed times use the **facility time zone**, not the browser's. Remote appointments also show the patient's local time when it differs.

---

## 2. Stack and dependencies

Install the latest stable release of each with `npm install`; do not hand-pin versions from memory.

| Purpose | Package |
|---|---|
| UI | `react`, `react-dom` |
| Build | `vite`, `@vitejs/plugin-react` |
| Language | `typescript`, `@types/react`, `@types/react-dom`, `@types/node` |
| Routing | `react-router` (data router: `createBrowserRouter`) |
| Server state | `@tanstack/react-query` |
| Runtime validation | `zod` |
| Dates and time zones | `date-fns`, `@date-fns/tz` |
| HTML sanitizing | `dompurify` |
| Mock API (dev and tests) | `msw` |
| Lint | `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals` |
| Format | `prettier` |
| Architecture check | `dependency-cruiser` |
| Unit and component tests | `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe` |
| End-to-end | `@playwright/test` |

Fonts: IBM Plex Sans and IBM Plex Mono, self-hosted from `public/fonts` (no third-party font CDN, so no patient browsing data reaches a third party).

Package manager: npm. Add `"engines": { "node": ">=22" }` and `.nvmrc` with `22`.

Not used, on purpose: no global state library (Redux, Zustand), no CSS-in-JS runtime, no UI kit (the designs define their own components), no analytics SDK (section 3).

---

## 3. Health data rules (mandatory)

"PHI" below means any data that identifies a patient or describes their health: names, MRN, contact details, dates of birth, appointments, diagnoses, results, medicines, notes.

1. **No PHI in browser storage.** Never write PHI to `localStorage`, `sessionStorage`, IndexedDB, Cache Storage or cookies set by JavaScript. Allowed in `localStorage`: UI preferences only (sidebar collapsed, last chosen facility id), through the `PreferenceStore` port.
2. **No tokens in JavaScript.** The session is an httpOnly, Secure, SameSite cookie set by the backend. The frontend sends a CSRF token header (read from a non-httpOnly cookie or a `/session` response) on every non-GET request.
3. **No PHI in URLs beyond opaque ids.** Path params are opaque ids (`/staff/patients/pt_8f2k...`), never MRN, name or phone. No PHI in query strings (search terms are sent in the request body or a header, not the address bar).
4. **No PHI in logs or telemetry.** The `Logger` port redacts known PHI fields; `console.log` is banned by lint. If error tracking is added later, it must run with PHI scrubbing and an ADR.
5. **No third-party scripts** on any page that shows PHI (no analytics, chat widgets, tag managers, font or icon CDNs).
6. **Clear on exit.** Sign out, session end and facility switch call `queryClient.clear()`, reset all draft stores and close SSE connections.
7. **Print and export** show patient name, MRN, printed-by and printed-at in the footer of every page.
8. **Fixtures are fictional.** Test and mock data use the fictional names in the designs. Never paste real patient data into the repo, tests or issues.
9. **Autofill:** clinical search fields use `autocomplete="off"`; patient registration fields use the proper `autocomplete` tokens.

---

## 4. Tenancy on the frontend

```ts
// core/tenant.ts
export type OrganizationId = Branded<string, 'OrganizationId'>
export type FacilityId = Branded<string, 'FacilityId'>
export interface TenantScope { readonly organizationId: OrganizationId; readonly facilityId: FacilityId }
```

- `TenantProvider` (in `app/`) holds the active scope. Staff choose it on C1; patients get it from their session (the facility they booked with, switchable when they have records in several).
- The HTTP client adds `X-Organization-Id` and `X-Facility-Id` headers from the scope. The backend still enforces access; the headers only say which facility the user is acting in.
- **Every query key starts with the scope:** `['f', facilityId, 'appointments', ...]`. Use the `scopedKeys(scope)` factory (section 10.1); raw array keys are banned by lint in `features/`.
- Switching facility: `queryClient.clear()`, reset drafts, navigate to the new facility's home. Never reuse cached data across facilities.
- Organization-wide data (patient identity, formulary, organization settings) uses `['o', organizationId, ...]` keys.

---

## 5. Repository layout

```
.
├── .github/workflows/ci.yml
├── .dependency-cruiser.cjs
├── eslint.config.js
├── .prettierrc.json
├── tsconfig.json  tsconfig.node.json
├── vite.config.ts
├── playwright.config.ts
├── index.html
├── public/fonts/                       IBM Plex Sans and Mono (woff2)
├── api/
│   └── openapi.yaml                    draft contract owned by the frontend (section 9)
├── docs/
│   ├── HANDOFF.md                      from the design handoff
│   ├── design/                         the .dc.html files
│   ├── ARCHITECTURE.md                 short: layers, patterns, how to add a feature
│   └── adr/
├── e2e/                                Playwright specs (one per core flow)
└── src/
    ├── main.tsx
    ├── vite-env.d.ts
    ├── app/                            composition root
    │   ├── App.tsx  router.tsx  routes.ts (typed route table)
    │   ├── createServices.ts  ServicesProvider.tsx
    │   ├── SessionProvider.tsx  TenantProvider.tsx  IdleLock.tsx
    │   ├── queryClient.ts
    │   └── shells/ (AuthShell, PortalShell, StaffShell, AdminShell, PatientBanner)
    ├── core/                           shared kernel, zero dependencies
    │   ├── result.ts  errors.ts  branded.ts  tenant.ts  assertNever.ts
    │   ├── clock.ts  logger.ts  events.ts  money.ts
    ├── domain/                         pure TypeScript: no React, DOM, fetch or storage
    │   ├── identity/ (Patient, Practitioner, StaffMember, Role, Permission, can())
    │   ├── scheduling/ (AvailabilityBlock, TimeOff, BookingRules, slot rules, dayStatus)
    │   ├── appointments/ (Appointment, status machine, cancellation rules)
    │   ├── packages/ (ConsultationPackage, PackageItem, format rules, enrollment)
    │   ├── clinical/ (Problem, Allergy, Vital, ClinicalNote, note status machine)
    │   ├── labs/ (LabOrder, LabResult, flag rules, reference ranges, duplicate check)
    │   ├── medications/ (Medication, MedicationRequest, refill machine, safety checks)
    │   └── time/ (facility time zone helpers on top of date-fns and @date-fns/tz)
    ├── application/                    use cases and ports; imports domain and core only
    │   ├── ports/ (one file per aggregate)
    │   └── usecases/ (bookAppointment, cancelAppointment, saveAvailabilityBlock,
    │                   blockTime, previewTimeOffImpact, bookPackage, publishPackage,
    │                   signNote, placeLabOrder, acknowledgeResult, releaseResult,
    │                   requestRefill, decideRefill, register, resetPassword, ...)
    ├── infrastructure/                 adapters; imports application ports, domain, core
    │   ├── http/ (client, interceptors, csrf, problem+json mapping)
    │   ├── api/ (one folder per resource: dto schemas, mappers, repository)
    │   ├── realtime/ (sse client for critical results and schedule changes)
    │   ├── storage/ (preferenceStore: UI prefs only)
    │   ├── print/ (browserPrinter)
    │   └── mock/ (msw handlers, in-memory db, seed data from the designs)
    ├── features/                       UI by feature; each exposes only index.ts
    │   ├── auth/ registration/ password-reset/
    │   ├── portal-home/ doctor-search/ booking/ patient-packages/ my-appointments/
    │   ├── lab-reports/ medicines/
    │   ├── workspace/ staff-dashboard/ patient-list/ clinic-schedule/
    │   ├── chart/ notes/ lab-orders/ results-review/ medication-requests/
    │   ├── admin-availability/ admin-time-off/ admin-packages/ admin-organization/
    │   (each: index.ts, model/ (container hook, reducers, view models, presenters),
    │    components/, queries.ts, *.module.css, *.test.tsx)
    ├── ui/                             design-system primitives, domain-agnostic
    │   ├── Button, IconButton, TextAction, Field, TextInput, Select, Textarea,
    │   │   Checkbox, Radio, Switch, SegmentedControl, Chip, Tag, Card, Table,
    │   │   Tabs, Stepper, Modal, ConfirmDialog, Combobox, Toast, Banner,
    │   │   EmptyState, Avatar, RangeBar, Sparkline, TrendChart, Calendar, SafeHtml
    │   └── icons/
    ├── i18n/ (en.ts message catalog, t(), formatters on Intl)
    ├── shared/ (cx, array, string helpers with no domain meaning)
    ├── styles/ (tokens.css, base.css, print.css)
    └── test/ (setup.ts, renderWithServices.tsx, fakes/, fixtures/)
```

---

## 6. Dependency rule (enforced)

```
app  ->  features  ->  application  ->  domain  ->  core
 |           |                              ^
 |           +--> ui, i18n, shared          |
 +--> infrastructure  ---------------------+  (implements application ports)
```

| Layer | May import | Must not import |
|---|---|---|
| `core` | nothing | everything else, npm packages |
| `domain` | `core`, `shared`, `date-fns`, `@date-fns/tz` | `application`, `infrastructure`, `features`, `ui`, `app`, `react*`, `@tanstack/*`, `zod`, `dompurify`, DOM globals |
| `application` | `domain`, `core`, `shared` | `infrastructure`, `features`, `ui`, `app`, `react*`, `@tanstack/*` |
| `infrastructure` | `application` ports, `domain`, `core`, `shared`, `zod`, `msw` | `features`, `ui`, `app`, `react*` |
| `ui` | `shared`, `core`, `i18n`, `react*`, `dompurify` | `domain`, `application`, `infrastructure`, `features`, `app` |
| `features/X` | `application`, `domain`, `core`, `shared`, `ui`, `i18n`, `app` provider hooks, other features via `index.ts` only | `infrastructure`, deep imports into another feature |
| `app` | everything | n/a (composition root; the only place that creates adapters) |

### `.dependency-cruiser.cjs`

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    { name: 'domain-is-pure', severity: 'error', from: { path: '^src/(domain|core)/' }, to: { path: '^src/(application|infrastructure|features|ui|app|i18n)/' } },
    {
      name: 'domain-no-frameworks',
      severity: 'error',
      from: { path: '^src/(domain|core)/' },
      to: { path: 'node_modules/(react|react-dom|react-router|@tanstack|zod|dompurify|msw)(/|$)' },
    },
    {
      name: 'core-no-packages',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: 'node_modules/' },
    },
    {
      name: 'application-no-outer-layers',
      severity: 'error',
      from: { path: '^src/application/' },
      to: { path: ['^src/(infrastructure|features|ui|app)/', 'node_modules/(react|react-dom|react-router|@tanstack)(/|$)'] },
    },
    {
      name: 'infrastructure-no-ui',
      severity: 'error',
      from: { path: '^src/infrastructure/' },
      to: { path: ['^src/(features|ui|app)/', 'node_modules/(react|react-dom|react-router)(/|$)'] },
    },
    { name: 'ui-is-domain-agnostic', severity: 'error', from: { path: '^src/ui/' }, to: { path: '^src/(domain|application|infrastructure|features|app)/' } },
    { name: 'features-not-to-infrastructure', severity: 'error', from: { path: '^src/features/' }, to: { path: '^src/infrastructure/' } },
    {
      name: 'features-only-via-index',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/', pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'] },
    },
    {
      name: 'mock-only-from-app-and-tests',
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/app/', '^src/test/', '^src/infrastructure/mock/', '\\.test\\.tsx?$'] },
      to: { path: '^src/infrastructure/mock/' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(test|spec)\\.(ts|tsx)$|^src/test/' },
  },
}
```

---

## 7. Configuration

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:mock": "vite --mode mock",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "arch": "depcruise src --config .dependency-cruiser.cjs",
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage",
    "e2e": "playwright test",
    "check": "npm run typecheck && npm run lint && npm run format:check && npm run arch && npm run test:run && vite build"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`tsconfig.node.json` covers `vite.config.ts` and `playwright.config.ts` with `strict: true` and `types: ["node"]`.

### Environment

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE: string          // e.g. /api
  readonly VITE_API_MOCK: 'true' | 'false' // true in --mode mock and in tests
}
```

`vite.config.ts`: `@` alias to `src`, dev proxy `/api` to `VITE_API_BASE` target, and the Vitest block:

```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
  css: false,
  coverage: {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/test/**', 'src/**/*.test.*', 'src/main.tsx', 'src/infrastructure/mock/**'],
    thresholds: {
      lines: 75,
      'src/domain/**': { lines: 95, branches: 90 },
      'src/application/**': { lines: 90, branches: 85 },
    },
  },
},
```

Use `defineConfig` from `vitest/config`.

`.prettierrc.json`: `{ "semi": false, "singleQuote": true, "printWidth": 120, "trailingComma": "all", "arrowParens": "always" }`

### `eslint.config.js` (flat config)

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'react/jsx-key': 'error',
      'react/no-danger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' }],
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-params': ['error', 4],
      eqeqeq: 'error',
      'no-console': 'error',
    },
  },
  // Browser capabilities only inside adapters and the composition root (section 3)
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/infrastructure/**', 'src/app/**', 'src/test/**', '**/*.test.*'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use an adapter in src/infrastructure.' },
        { name: 'localStorage', message: 'No PHI in storage. Use the PreferenceStore port for UI prefs.' },
        { name: 'sessionStorage', message: 'No PHI in storage.' },
        { name: 'indexedDB', message: 'No PHI in storage.' },
        { name: 'EventSource', message: 'Use the RealtimeChannel port.' },
        { name: 'confirm', message: 'Use ConfirmDialog from src/ui.' },
        { name: 'alert', message: 'Use Banner or Modal from src/ui.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'print', message: 'Use the Printer port.' },
        { object: 'Date', property: 'now', message: 'Inject Clock.' },
        { object: 'document', property: 'cookie', message: 'Cookies are set by the backend only.' },
      ],
    },
  },
  // Pure layers: no ambient time, no DOM, no network
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Inject Clock.' }],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'sessionStorage', 'fetch', 'navigator', 'EventSource'],
    },
  },
  // Query keys must come from scopedKeys (section 4)
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', { selector: "Property[key.name='queryKey'] > ArrayExpression", message: 'Use scopedKeys(scope) so every key carries the facility.' }],
    },
  },
  { files: ['src/ui/SafeHtml.tsx'], rules: { 'react/no-danger': 'off' } },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  { files: ['*.config.{js,ts}', '.dependency-cruiser.cjs'], ...tseslint.configs.disableTypeChecked },
)
```

### CI (`.github/workflows/ci.yml`)

`npm ci`, `npm run check`, then `npx playwright install --with-deps chromium` and `npm run e2e` against `vite preview --mode mock`.

---

## 8. Core kernel (`src/core`)

### Error policy

| Where | Failure style |
|---|---|
| Domain functions where failure is a normal outcome (slot not bookable, package format not offered, refill unsafe) | return `Result<T, Problem>` with a discriminated union of problem codes, never display strings |
| Adapters | throw a typed `AppError` subclass |
| Use cases | throw `AppError` when the critical step fails; return `{ value, warnings }` when non-critical steps fail |
| Components | show messages through presenters that map codes to `i18n` messages |

```ts
// result.ts
export type Ok<T> = { readonly ok: true; readonly value: T }
export type Err<E> = { readonly ok: false; readonly error: E }
export type Result<T, E> = Ok<T> | Err<E>
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

// errors.ts
export type LocalCode = 'network_error' | 'timeout' | 'aborted' | 'schema_mismatch' | 'session_locked' | 'unknown'
export type RemoteCode =
  | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'validation_failed'
  | 'slot_taken' | 'slot_outside_availability' | 'practitioner_on_leave' | 'mode_not_offered'
  | 'package_unavailable' | 'cancellation_window_closed' | 'duplicate_lab_order' | 'refill_not_allowed'
export type ErrorCode = LocalCode | RemoteCode | (string & Record<never, never>)

export class AppError extends Error {
  constructor(message: string, readonly code: ErrorCode, options?: { cause?: unknown }) {
    super(message, options)
    this.name = new.target.name
  }
}
/** Non-2xx answer parsed from RFC 9457 problem+json. `fields` holds per-field validation errors. */
export class ApiError extends AppError {
  constructor(message: string, code: ErrorCode, readonly status: number, readonly fields: Readonly<Record<string, string>> = {}) {
    super(message, code)
  }
}
export class SchemaError extends AppError {
  constructor(readonly endpoint: string, readonly issues: string) {
    super(`Unexpected response from ${endpoint}`, 'schema_mismatch')
  }
}
export const hasCode = (e: unknown, code: ErrorCode): e is AppError => e instanceof AppError && e.code === code
```

`ApiError.message` from the server is never shown to users directly; presenters map `code` to a message.

### Branded ids (patient safety)

```ts
// branded.ts
declare const tag: unique symbol
export type Branded<T, Name extends string> = T & { readonly [tag]: Name }
export type PatientId = Branded<string, 'PatientId'>
export type PractitionerId = Branded<string, 'PractitionerId'>
export type StaffId = Branded<string, 'StaffId'>
export type AppointmentId = Branded<string, 'AppointmentId'>
export type PackageId = Branded<string, 'PackageId'>
export type LabOrderId = Branded<string, 'LabOrderId'>
export type LabResultId = Branded<string, 'LabResultId'>
export type MedicationRequestId = Branded<string, 'MedicationRequestId'>
export type NoteId = Branded<string, 'NoteId'>
```

Ids are opaque strings from the API. Casting (`as PatientId`) is allowed only in `infrastructure/api/**/mappers.ts`. A function that takes a `PatientId` must not accept a `PractitionerId`; that is the point.

### Other kernel pieces

```ts
// clock.ts
export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() }

// logger.ts: adapters must redact PHI fields before writing anywhere
export interface Logger {
  warn(event: string, data?: Readonly<Record<string, string | number | boolean>>): void
  error(event: string, data?: Readonly<Record<string, string | number | boolean>>): void
}

// events.ts: tiny typed emitter
export interface Emitter<E extends Record<string, unknown>> {
  on<K extends keyof E>(event: K, fn: (payload: E[K]) => void): () => void
  emit<K extends keyof E>(event: K, payload: E[K]): void
}

// money.ts: integer minor units, used for fees and package prices only
export type Money = Readonly<{ minor: number; currency: string }>
```

---

## 9. API contract and mock backend

The backend does not exist yet. The frontend builds against a contract and a mock so the API can be implemented later to match.

1. **`api/openapi.yaml`** is the draft contract, written by the frontend team from `HANDOFF.md` (data model) and the screens. Conventions: JSON, camelCase, ISO 8601 UTC timestamps (`2026-10-21T04:35:00Z`), opaque string ids, cursor pagination (`{ items, nextCursor }`), errors as `application/problem+json` with a `code` field from `RemoteCode`.
2. **Zod schemas in `infrastructure/api/<resource>/dto.ts`** are the runtime source of truth in the frontend. A test validates every example in `openapi.yaml` against the matching Zod schema so the two cannot drift.
3. **Mock server** in `infrastructure/mock/`: MSW handlers backed by an in-memory db seeded from the designs' sample data (Ramesh Pandey, Ram Bahadur Thapa, Dr. Prakash Karki and the rest). The mock enforces real rules (slots inside blocks, time off, minimum notice, cancellation window, refill state transitions, tenant scoping) so features are tested against realistic behavior, not happy paths.
4. `npm run dev:mock` starts the app with the MSW service worker. Tests use the MSW node server with the same handlers.
5. When the backend ships, only `VITE_API_BASE` and `VITE_API_MOCK=false` change. If the backend publishes its own OpenAPI file, replace the draft and fix whatever the Zod contract test reports.

Endpoint groups to define (paths are suggestions; keep them resource-oriented):

| Group | Examples |
|---|---|
| Session | `POST /session` (sign in), `DELETE /session`, `GET /session`, `POST /session/unlock`, `POST /password-reset`, `POST /password-reset/confirm` |
| Registration | `POST /registrations`, `POST /registrations/{id}/verify` |
| Tenancy | `GET /me/facilities`, `GET /organizations/{id}`, `GET /facilities` |
| Practitioners | `GET /practitioners?category=&q=` (q in a header if it carries patient context), `GET /practitioners/{id}` |
| Scheduling | `GET/POST/PATCH/DELETE /practitioners/{id}/availability-blocks`, `GET/POST /time-off`, `POST /time-off/impact-preview`, `GET /practitioners/{id}/slots?from=&to=&mode=`, `GET/PUT /booking-rules` |
| Appointments | `GET /appointments`, `POST /appointments`, `POST /appointments/{id}/cancel`, `POST /appointments/{id}/reschedule` |
| Packages | `GET/POST/PATCH /packages`, `POST /packages/{id}/publish`, `POST /package-enrollments` |
| Clinical | `GET /patients/{id}/summary`, `GET/POST /patients/{id}/notes`, `POST /notes/{id}/sign` |
| Labs | `GET /lab-catalogue`, `POST /lab-orders`, `GET /results/inbox`, `GET /results/{id}`, `POST /results/{id}/acknowledge`, `POST /results/{id}/release` |
| Medications | `GET /patients/{id}/medications`, `POST /medication-requests`, `GET /medication-requests?status=pending`, `POST /medication-requests/{id}/decision` |
| Realtime | `GET /events` (SSE stream: `result.critical`, `appointment.changed`, `time-off.created`) |

---

## 10. Infrastructure layer

### 10.1 Query keys

```ts
// app/queryKeys.ts
export const scopedKeys = (s: TenantScope) => {
  const f = ['f', s.facilityId] as const
  const o = ['o', s.organizationId] as const
  return {
    practitioners: (filter: { category?: string; q?: string }) => [...f, 'practitioners', filter] as const,
    practitioner: (id: PractitionerId) => [...f, 'practitioners', id] as const,
    availability: (id: PractitionerId) => [...f, 'availability', id] as const,
    timeOff: (range: { from: string; to: string }) => [...f, 'time-off', range] as const,
    slots: (id: PractitionerId, mode: VisitMode, from: string) => [...f, 'slots', id, mode, from] as const,
    appointments: { all: [...f, 'appointments'] as const, mine: [...f, 'appointments', 'mine'] as const },
    packages: [...f, 'packages'] as const,
    patientSummary: (id: PatientId) => [...o, 'patients', id, 'summary'] as const,
    resultsInbox: [...f, 'results', 'inbox'] as const,
    result: (id: LabResultId) => [...f, 'results', id] as const,
    medicationRequests: [...f, 'medication-requests'] as const,
  }
}
```

### 10.2 HTTP client: Chain of Responsibility

```ts
export type Handler = (req: HttpRequest) => Promise<HttpResponse>
export type Interceptor = (next: Handler) => Handler
export const compose = (interceptors: readonly Interceptor[], terminal: Handler): Handler =>
  interceptors.reduceRight<Handler>((next, wrap) => wrap(next), terminal)
```

Interceptors, outermost first: `sessionGuard(events)` (401 -> emit `sessionEnded`; 423 -> emit `sessionLocked`; rethrow), `tenantHeaders(tenant)`, `csrf()`, `requestId()` (random `X-Request-Id` for support tickets; contains no PHI), `timeout(15_000)` (own `AbortController`, forwards the caller's signal, `timeout` vs `aborted`), `problemJson()` (non-2xx -> `ApiError` from problem+json; fetch rejection -> `AppError('network_error')`). The terminal handler is the only `fetch` call, always with `credentials: 'include'`, JSON bodies, and 204 handled without parsing.

### 10.3 Adapters: schema, map, throw

One folder per resource: `dto.ts` (Zod), `mappers.ts` (DTO -> domain, the only place with id casts and `Date` parsing), `repository.ts` (implements the port).

```ts
// infrastructure/api/practitioners/dto.ts
export const PractitionerDto = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.string(),
  qualifications: z.string(),
  languages: z.array(z.string()),
  offersOnsite: z.boolean(),
  offersRemote: z.boolean(),
  nextAvailableAt: z.string().datetime().nullable(),
})
```

Each adapter has a fixture test and a negative test (missing required field -> `SchemaError`).

### 10.4 Realtime

`RealtimeChannel` port with `subscribe(event, handler): Unsubscribe`. The SSE adapter reconnects with backoff, resubscribes after facility switch, and closes on sign out. Events only carry ids and types; the handler invalidates the matching query keys and the UI refetches. Critical results also raise a persistent `Banner` in the staff shell until acknowledged.

### 10.5 Ports for browser capabilities

`PreferenceStore` (UI prefs only, typed keys, never PHI), `Printer` (renders a `PrintableDocument` into an app-level print root, adds the PHI footer, calls `window.print()`), `IdleDetector` (activity events for the lock timer).

---

## 11. Domain layer (examples of the patterns to use)

### 11.1 Unions as constants

```ts
export const VISIT_MODES = ['onsite', 'remote'] as const
export type VisitMode = (typeof VISIT_MODES)[number]

export const BLOCK_MODES = ['onsite', 'remote', 'both'] as const
export type BlockMode = (typeof BLOCK_MODES)[number]

export const PACKAGE_FORMATS = ['onsite', 'remote', 'hybrid', 'patient_choice'] as const
export type PackageFormat = (typeof PACKAGE_FORMATS)[number]

export const APPOINTMENT_STATUSES = ['booked', 'arrived', 'completed', 'cancelled', 'no_show'] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]
```

### 11.2 Specifications: bookability (A1, A2, P5)

```ts
// domain/scheduling/bookable.ts
export type SlotProblem =
  | { kind: 'outside-availability' }
  | { kind: 'on-leave'; until: Date }
  | { kind: 'too-soon'; minNoticeMinutes: number }
  | { kind: 'too-far'; maxDaysAhead: number }
  | { kind: 'mode-not-offered'; mode: VisitMode }

export interface BookabilityInput {
  start: Date
  mode: VisitMode
  blocks: readonly AvailabilityBlock[]
  timeOff: readonly TimeOff[]
  rules: BookingRules
  practitioner: Pick<Practitioner, 'offersOnsite' | 'offersRemote'>
  now: Date
  timeZone: string // facility IANA zone, e.g. 'Asia/Kathmandu'
}

export function checkSlot(input: BookabilityInput): Result<true, SlotProblem>

/** For the date strip in P5: 'open' | 'closed' | 'on-leave' | 'full' per day. */
export function dayStatus(day: Date, input: Omit<BookabilityInput, 'start'>): DayStatus
```

The server is the authority; the frontend runs the same rules to grey out options and explain why before the user submits. A `slot_taken` or `practitioner_on_leave` from the server refreshes slots and shows the presenter message.

`blockSlotCount(block)` and `weeklySummary(blocks)` power the counts in A1. `timeOffImpact` is computed by the server (`/time-off/impact-preview`); the frontend only renders it.

### 11.3 State machines

Write each as a pure reducer with an exhaustive `switch` and `assertNever`, and make the transition table the test.

- `bookingFlow` (P5): `search -> mode -> slot -> confirm -> submitting -> booked | failed`. Changing doctor resets mode and slot; changing mode resets slot.
- `packageBookingFlow` (P6): `browse -> detail -> format -> first-visit -> submitting -> booked | failed`.
- `appointmentStatus`: allowed transitions and who can make them (patient may cancel only `booked` and only before the cancellation cut-off).
- `noteStatus` (C6): `draft -> signed`, then addenda only.
- `labResultReview` (C8): `unreviewed -> acknowledged`, `release` independent and only after acknowledgement for critical results.
- `refillRequest` (P9, C9): `requested -> under-review -> approved | changed | declined -> ready-for-pickup | delivered`.
- `timeOffForm` (A2): `editing -> previewing-impact -> saving -> saved`.

### 11.4 Strategies

- `visitModes: Record<VisitMode, VisitModeConfig>` (label key, icon, location or video instructions, fee placeholder) used by P5 and P6.
- `packageFormats: Record<PackageFormat, { allowedModes(firstVisit: boolean): readonly VisitMode[] }>` so hybrid (first visit on-site, then remote) is data, not branches.
- `labFlagRules`: maps a result and its reference range to `normal | high | low | critical-high | critical-low`.
- `refillSafetyChecks: readonly RefillCheck[]` (each a pure function of request, latest labs, allergies, last dispensed). C9 shows every check that fires. Adding a check means one function and one test.

### 11.5 Time

- The API sends UTC. Domain functions take and return `Date`.
- `domain/time` wraps `@date-fns/tz` (`TZDate`) for "start of day in facility zone", "weekday in facility zone" and slot generation. Never use the browser's local zone for clinical or scheduling logic.
- Display formatting lives in `i18n/format.ts` (`formatTime(date, zone)`, `formatDay(date, zone)`), using `Intl.DateTimeFormat` with an explicit `timeZone`.
- Nepal is UTC+5:45; fixtures must include it, plus a zone with daylight saving time, so 45-minute and DST edge cases are tested.

---

## 12. Application layer

### 12.1 Ports

One file per aggregate in `application/ports/`. Reads take an optional `AbortSignal` last. Interface segregation: a use case's `Deps` uses `Pick<>` to name only the methods it needs.

```ts
export interface AppointmentRepository {
  listMine(signal?: AbortSignal): Promise<Appointment[]>
  book(input: NewAppointment): Promise<Appointment>
  cancel(id: AppointmentId, reason: CancelReason): Promise<Appointment>
}
export interface SchedulingRepository {
  blocks(id: PractitionerId, signal?: AbortSignal): Promise<AvailabilityBlock[]>
  saveBlock(id: PractitionerId, block: NewAvailabilityBlock): Promise<AvailabilityBlock>
  timeOff(range: DateRange, signal?: AbortSignal): Promise<TimeOff[]>
  previewTimeOff(input: NewTimeOff): Promise<TimeOffImpact>
  createTimeOff(input: NewTimeOff): Promise<TimeOff>
  slots(id: PractitionerId, mode: VisitMode, range: DateRange, signal?: AbortSignal): Promise<Slot[]>
  rules(signal?: AbortSignal): Promise<BookingRules>
}
```

### 12.2 Use cases

```ts
export type Warning =
  | { code: 'reminder-not-scheduled'; reason: string }
  | { code: 'calendar-file-failed'; reason: string }
  | { code: 'notification-partial'; notified: number; total: number }

export interface Outcome<T> { value: T; warnings: readonly Warning[] }

export const bookAppointment =
  (deps: { appointments: Pick<AppointmentRepository, 'book'>; clock: Clock }) =>
  async (input: BookInput): Promise<Outcome<Appointment>> => {
    const check = checkSlot({ ...input.context, start: input.start, mode: input.mode, now: deps.clock.now() })
    if (!check.ok) throw new AppError('Slot not bookable', toRemoteCode(check.error))
    const appointment = await deps.appointments.book(toNewAppointment(input)) // critical
    return { value: appointment, warnings: [] }
  }
```

Use cases to create, by screen: `signIn`, `unlockSession`, `signOut`, `register`, `verifyRegistration`, `requestPasswordReset`, `confirmPasswordReset`, `selectFacility` (P1 to P3, C1); `bookAppointment`, `cancelAppointment`, `rescheduleAppointment` (P5, P7, C4); `bookPackage` (P6); `saveAvailabilityBlock`, `saveBookingRules` (A1); `previewTimeOff`, `createTimeOff` (A2); `savePackage`, `publishPackage` (A3); `saveNoteDraft`, `signNote` (C6); `placeLabOrder` (C7); `acknowledgeResult`, `releaseResult` (C8); `requestRefill` (P9); `decideRefill` (C9).

Every use case has tests for each failure position using in-memory fakes from `src/test/fakes`.

### 12.3 Composition root

```ts
export interface Services {
  readonly clock: Clock
  readonly logger: Logger
  readonly events: Emitter<{ sessionEnded: undefined; sessionLocked: undefined; facilityChanged: FacilityId }>
  readonly prefs: PreferenceStore
  readonly printer: Printer
  readonly realtime: RealtimeChannel
  readonly repos: { session: SessionRepository; practitioners: PractitionerRepository; scheduling: SchedulingRepository; appointments: AppointmentRepository; packages: PackageRepository; clinical: ClinicalRepository; labs: LabRepository; medications: MedicationRepository; tenancy: TenancyRepository }
  readonly useCases: { bookAppointment: ReturnType<typeof bookAppointment> /* ... */ }
}
export function createServices(config: AppConfig, tenant: TenantScopeSource, overrides: Partial<Services> = {}): Services
```

`main.tsx`: if `VITE_API_MOCK` start the MSW worker, then `createServices()`, then render `<StrictMode><QueryClientProvider><ServicesProvider><SessionProvider><TenantProvider><RouterProvider/>`.

---

## 13. Features, routing and UI

### 13.1 Routes

One typed table in `app/routes.ts`; screens are lazy-loaded per area so the patient bundle never contains staff or admin code.

| Route | Feature | Guard |
|---|---|---|
| `/login`, `/register`, `/forgot-password` | auth, registration, password-reset | signed out |
| `/portal`, `/portal/book`, `/portal/packages`, `/portal/appointments`, `/portal/reports`, `/portal/medicines` | portal-home, booking, patient-packages, my-appointments, lab-reports, medicines | role `patient` |
| `/staff/workspace` | workspace | staff, no facility chosen |
| `/staff`, `/staff/patients`, `/staff/schedule`, `/staff/results`, `/staff/medication-requests` | staff features | staff + facility + permission |
| `/staff/patients/:patientId`, `.../notes/new`, `.../orders/new` | chart, notes, lab-orders | permission `chart:read` / `note:write` / `order:write` |
| `/admin/availability`, `/admin/time-off`, `/admin/packages`, `/admin/organization` | admin features | permission `schedule:admin` / `package:admin` / `org:admin` |

Guards run in route loaders. Hidden navigation is a convenience; the server enforces permissions. A forbidden route shows a "You do not have access" screen, not a redirect loop.

### 13.2 Permissions

```ts
export const PERMISSIONS = [
  'chart:read', 'note:write', 'note:sign', 'order:write', 'result:review', 'result:release',
  'refill:decide', 'schedule:read', 'schedule:book-for-patient', 'schedule:admin', 'package:admin', 'org:admin',
] as const
export type Permission = (typeof PERMISSIONS)[number]
export const can = (session: StaffSession, p: Permission): boolean => session.permissions.includes(p)
```

`usePermission(p)` hides or disables controls; disabled controls explain why in a tooltip or helper text.

### 13.3 Component rules

- Each feature: a **container hook** (`useBookingScreen`) owns queries, mutations and the view model; **presentational components** are pure functions of props, with no `useServices` and no fetching.
- One exported component per file; files at most 200 lines; functions at most 60; at most 8 props (group into a typed object beyond that).
- Discriminated unions instead of boolean mode flags.
- No clickable `div` or `span`; no `<a href="#">` for actions; no `window.confirm`.
- Every user-facing string comes from `i18n/en.ts` through `t()` (section 13.5); presenters map domain problems and error codes to messages.
- Forms: controlled inputs, inline field errors from `ApiError.fields`, errors announced with `aria-live`, submit disabled only while submitting (never disabled without a visible reason).
- Empty, loading and error states are designed for every list (see the designs' empty states). Loading uses skeletons sized like the content.

### 13.4 Design system (`src/ui`)

Build these primitives first from `HANDOFF.md` tokens and the `.dc.html` files: `Button` (`primary | secondary | ghost | danger`, `sm | md`), `IconButton` (requires `label`), `TextAction`, `Field` + `TextInput` / `Select` / `Textarea`, `Checkbox`, `Radio`, `Switch` (`role="switch"`), `SegmentedControl`, `Chip` (filter chips with counts), `Tag` (`neutral | info | alert | critical | warn | outline`), `Card`, `Table` (horizontal scroll wrapper on small screens), `Tabs`, `Stepper` (booking progress), `Modal` (focus trap, Escape, focus return, `aria-modal`), `ConfirmDialog` (`useConfirm()` promise API), `Combobox` (ARIA combobox for patient and doctor search), `Toast` (`role="status"`), `Banner` (`role="alert"` for critical), `EmptyState`, `Avatar` (initials), `Calendar` (month grid for A2), `RangeBar` (P8), `Sparkline` and `TrendChart` (C5, C8: one series, 2px line, 8px markers, reference band, value labels, keyboard-reachable points with text alternatives), `SafeHtml`.

- `styles/tokens.css` holds the tokens from `HANDOFF.md` as CSS variables; components use CSS Modules that reference the variables. No inline `style` for layout.
- Touch targets at least 44px in the patient portal; 40px minimum in staff and admin.
- `SafeHtml` is the only place allowed to use `dangerouslySetInnerHTML`; it runs DOMPurify with a short allow-list and forces `rel="noopener noreferrer"` on links. Used for package descriptions and doctor notes released to patients.
- Every primitive has a `vitest-axe` test.

### 13.5 Internationalization

English only at launch, but all user-facing strings live in `src/i18n/en.ts` as a typed nested object and are read with `t('booking.mode.remote.title')`. Dates, times and numbers use `Intl` with explicit locale and time zone. Adding a second language (for example Nepali) later means adding `ne.ts` and an ADR for a library if pluralization needs grow. Layouts must tolerate 30% longer strings.

### 13.6 Feature notes by screen

- **P5 booking:** search runs on input with a 250ms debounce, matches name, category and keywords (server-side `q`), and keeps the category chip counts in sync with the search. Selecting a doctor moves to the mode step; modes the doctor does not offer are disabled with "Not offered by this doctor". The date strip uses `dayStatus`.
- **P6 packages:** shares `Combobox`, `Chip` and the format strategy with P5. The first visit is booked through the same slot rules as P5.
- **P7 appointments:** cancel uses `Modal` with reason radios and shows the cancellation window rule; success shows a `Toast` with Undo while the server still allows it.
- **A1 availability:** the weekly template renders `blockSlotCount`; the new-block form validates start before end and no overlap with existing blocks on the chosen days (domain function, also enforced by the server).
- **A2 time off:** "Check impact" calls `previewTimeOff` and lists affected appointments before saving; the handling choice (notify, reassign, keep) is required.
- **A3 packages:** editor and live preview share one view model; the preview renders the same `PackageCard` component as P6 (exported from `patient-packages/index.ts`).
- **C5 to C8:** the patient banner is part of the chart layout route, not each screen, so it can never be missing.
- **C8 results:** critical results arrive via realtime; acknowledging is required before releasing to the patient.
- **C9 medication requests:** every refill safety check that fires is listed above the decision controls; approving with a fired check needs a second confirmation that names the check.

---

## 14. Testing strategy

| Level | Scope | Tooling | Requirement |
|---|---|---|---|
| Unit | `core`, `domain`, reducers, presenters, formatters | Vitest | domain 95% lines and 90% branches; every state machine transition table |
| Use case | each use case, each failure position | Vitest + fakes | all use cases |
| Contract | `openapi.yaml` examples vs Zod DTOs; mappers | Vitest | every endpoint |
| Adapter | interceptors, problem+json mapping, timeout, 401 and 423, SSE reconnect | Vitest + MSW | every interceptor |
| Component and feature | screens through `renderWithServices` with the mock db | Testing Library + user-event + vitest-axe | happy path, error path and a11y smoke per screen |
| Visual check | each screen against its `.dc.html` at 1440px and 390px | Playwright screenshots, reviewed by a person | per screen PR |
| End-to-end | the eight core flows in `HANDOFF.md` | Playwright against `dev:mock` | green in CI |

Required specific tests:
- Tenant isolation: switching facility clears the cache; no request after the switch carries the old facility header; query keys without scope are rejected by lint.
- Session: idle lock after the configured time with a fake clock; 401 and 423 paths; sign out clears cache and drafts.
- PHI: a test fails if anything is written to `localStorage`, `sessionStorage` or `document.cookie` during the core flows, except allow-listed preference keys.
- Time zones: slot and day status tests in `Asia/Kathmandu` and one DST zone, including the day boundary.
- Accessibility: keyboard-only run of booking, cancellation and refill decision.

`src/test/renderWithServices.tsx` builds `Services` from fakes (controllable `Clock`, in-memory repositories, recording `Printer`), wraps with a fresh `QueryClient` (retries off), a memory router, and `SessionProvider` / `TenantProvider` with a chosen role and facility.

---

## 15. Build phases and exit criteria

Each phase ends with `npm run check` green and the affected screens demoed in `dev:mock`.

**F0: Scaffold and tooling**
Vite + React + TS, ESLint, Prettier, Vitest, Playwright, dependency-cruiser, CI, `.nvmrc`, `docs/ARCHITECTURE.md`, ADRs from section 16, fonts self-hosted, `tokens.css`.
Exit: CI green on an empty app with all rules active.

**F1: Kernel, session, tenancy, shells, design system**
`core/*`, HTTP client and interceptors, `SessionProvider`, `IdleLock`, `TenantProvider`, `scopedKeys`, the four shells, all `ui/` primitives with a11y tests, `i18n` setup.
Exit: shells match the designs at 1440px and 390px; idle lock and facility switch tests pass.

**F2: Contract and mock backend**
`api/openapi.yaml` for all endpoint groups, Zod DTOs, mappers, repositories, MSW handlers with rule enforcement, seed data from the designs.
Exit: contract tests pass for every endpoint; mock enforces scheduling and tenancy rules.

**F3: Access (P1, P2, P3, C1)**
Exit: sign in for both roles, registration with verification, password reset, facility selection; e2e flow 1 green.

**F4: Admin scheduling (A1, A2)**
Domain scheduling module, availability editor, booking rules, time off with impact preview.
Exit: e2e flows 5 and 6 green; time zone tests pass.

**F5: Booking and appointments (P5, P7, C4, P4 next-appointment card)**
Exit: e2e flows 2 and 3 green; leave days show as "On leave" in P5.

**F6: Consultation packages (A3, P6)**
Exit: e2e flow 4 green; published packages appear in P6; hybrid format books the first visit on-site.

**F7: Clinical (C5, C6, C7, C8, P8)**
Patient banner layout route, note editor, lab ordering with duplicate warning, results inbox and review, realtime critical results, release to portal.
Exit: e2e flow 7 green; critical result banner appears without refresh in the mock.

**F8: Medicines (P9, C9)**
Exit: e2e flow 8 green; safety checks listed and double-confirmed.

**F9: Dashboards and organization (P4, C2, C3, A4)**
Exit: all 22 screens match their designs; no screen has unhandled loading, empty or error states.

**F10: Hardening**
Performance budget (patient bundle under 200 KB gzipped for the first route; lazy routes per area), print views with PHI footer, keyboard-only pass, `vitest-axe` on every screen, PHI storage test across all e2e flows, final ADR review.
Exit: all invariants in section 1 covered by tests; README explains `dev`, `dev:mock`, `check`, `e2e`.

---

## 16. Decisions (defaults unless the owner says otherwise)

| Decision | Default | Reason |
|---|---|---|
| App shape | One Vite SPA with three lazy-loaded areas | Shared design system and session; separate bundles per area |
| Routing | React Router data router with loaders as guards | Guards run before render; typed route table |
| Server state | TanStack Query with scoped keys | Caching, polling and invalidation without hand-written code |
| Client state | Reducers plus Context with selector hooks | Draft and flow state is small and local |
| Auth transport | httpOnly session cookie + CSRF header | No tokens reachable from JavaScript |
| Idle lock | Staff 10 min, patients 15 min | Shared clinical computers |
| Realtime | Server-sent events | One-way, simple, works through proxies |
| Dates | date-fns + @date-fns/tz, facility zone for display | Correct across zones, including UTC+5:45 |
| Styling | CSS Modules over CSS variables | Matches the tokens; no runtime cost |
| Contract | Frontend-owned OpenAPI draft + Zod at runtime | Backend not built yet; contract test keeps both in sync |
| i18n | English catalog from day one, no library yet | Cheap now, expensive to retrofit |
| Telemetry | None until an ADR with PHI scrubbing | Health data rules |
| Node | 22 | Current LTS |

Record each as a one-page ADR in `docs/adr/`: context, decision, consequences.

---

## 17. Definition of done (every PR)

- [ ] `npm run check` passes.
- [ ] No `any`, `@ts-ignore`, non-null `!`, or unexplained `eslint-disable`; type assertions only in `infrastructure/api/**/mappers.ts`.
- [ ] New logic has tests at the right level (section 14); state machines have transition-table tests.
- [ ] Every new query key comes from `scopedKeys`; no PHI written to browser storage, URLs or logs.
- [ ] The screen matches its `.dc.html` at 1440px and 390px (screenshots in the PR).
- [ ] Loading, empty and error states exist for every list and form.
- [ ] Keyboard and screen reader basics checked; `vitest-axe` passes.
- [ ] No em dashes or en dashes in new docs, comments or UI copy.

## 18. Do not

- Do not store PHI or tokens in any browser storage, or put PHI in URLs or logs.
- Do not create a query key without the facility or organization scope.
- Do not show a result flag or status by color alone.
- Do not compute scheduling in the browser's local time zone.
- Do not let a feature import `infrastructure/` or another feature's internals.
- Do not add third-party scripts, CDNs or analytics.
- Do not hand-roll caching or polling; use TanStack Query and the realtime port.
- Do not add global mutable state or module-level `let` outside `src/app/createServices.ts`.
- Do not format domain problems or warnings as English inside `domain/` or `application/`.

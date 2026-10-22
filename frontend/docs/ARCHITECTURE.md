# Architecture

Folio EHR web is one React single page app with three areas: the patient portal (`/portal`), the clinician workspace (`/staff`) and the admin console (`/admin`). The full rules are in `design-files/docs/codebase.md`; this page is the short version.

## Layers

```
app  ->  features  ->  application  ->  domain  ->  core
 |           |                              ^
 |           +--> ui, i18n, shared          |
 +--> infrastructure  ---------------------+
```

- `core`: kernel types with no dependencies (`Result`, `AppError`, branded ids, `Clock`, `Logger`, emitter, money).
- `domain`: pure TypeScript business rules (scheduling, appointments, packages, clinical, labs, medications, time). No React, DOM, network or storage.
- `application`: ports (interfaces) and use cases. Imports only domain and core.
- `infrastructure`: adapters that implement ports: HTTP client with interceptors, Zod DTOs and mappers, SSE, preference store, printer, and the MSW mock backend.
- `features`: one folder per screen group. Each has a container hook that owns queries and the view model, and presentational components that only take props. Other code imports a feature only through its `index.ts`.
- `ui`: design-system primitives built from the tokens. Domain agnostic.
- `app`: the composition root. Creates services, providers, the router, guards and shells. The only place that creates adapters.

`npm run arch` (dependency-cruiser) and `npm run lint` enforce these rules.

## Patterns

- Failures that are normal outcomes return `Result`; adapters throw `AppError`; presenters map error codes to i18n messages.
- State machines are pure reducers with exhaustive switches; their transition tables are their tests.
- Strategies (visit modes, package formats, lab flag rules, refill safety checks) are data, not branches.
- Every query key comes from `scopedKeys(scope)`, so cached data can never cross facilities.

## Adding a feature

1. Add domain types and rules with tests in `src/domain/<area>`.
2. Add or extend a port in `src/application/ports` and a use case in `src/application/usecases` with tests against fakes.
3. Implement the port in `src/infrastructure/api/<resource>` (dto, mappers, repository) and add mock handlers.
4. Build the screen in `src/features/<name>`: container hook, components, CSS module, test with `renderWithServices`.
5. Register the route in `src/app/routes.ts` with its guard.
6. Add every string to `src/i18n/en.ts`.

## Health data

No PHI in browser storage, URLs, logs or third-party scripts. Sign out, lock timeout and facility switch clear the query cache, drafts and realtime connections.

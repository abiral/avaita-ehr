# ADR 0014: Toolchain version constraints

Status: accepted

## Context

The setup guide asks for the latest stable release of each package. At scaffold time the latest TypeScript (7.x) and ESLint (10.x) were not yet supported by `typescript-eslint` (TypeScript below 6.1) and `eslint-plugin-jsx-a11y` (ESLint 9 or lower).

## Decision

Use TypeScript `~6.0` and ESLint `^9` with `@eslint/js` `^9`. Every other package uses its latest stable release.

## Consequences

Upgrade both when the lint plugins declare support. No behavior change for the app.

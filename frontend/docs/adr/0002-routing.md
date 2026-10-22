# ADR 0002: React Router data router with loaders as guards

Status: accepted

## Context

Access depends on role, chosen facility and per-facility permissions. Guards must run before any protected screen renders or fetches.

## Decision

Use `createBrowserRouter` from `react-router`. Guards run in route loaders and redirect or throw a forbidden response. Routes are declared once in a typed table in `src/app/routes.ts`.

## Consequences

No flash of protected content. Guards are plain functions and can be tested without rendering. Hidden navigation stays a convenience; the server still enforces permissions.

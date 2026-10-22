# ADR 0010: Frontend-owned OpenAPI draft and Zod at runtime

Status: accepted

## Context

The backend does not exist yet.

## Decision

The frontend owns `api/openapi.yaml`. Zod schemas in `src/infrastructure/api/**/dto.ts` validate every response at runtime. A contract test validates each OpenAPI example against its Zod schema. An MSW mock server enforces the real business rules.

## Consequences

Features are built and tested now. When the backend ships, only `VITE_API_BASE` and `VITE_API_MOCK` change, and the contract test reports any drift.

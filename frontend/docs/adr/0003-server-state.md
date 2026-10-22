# ADR 0003: TanStack Query with scoped keys

Status: accepted

## Context

Every screen reads server data that must be cached, refetched and invalidated, and must never leak across facilities.

## Decision

Use `@tanstack/react-query`. Every query key is built by `scopedKeys(scope)` and starts with `['f', facilityId]` or `['o', organizationId]`. Raw array keys in `features/` fail lint.

## Consequences

No hand-written caching or polling. Facility switch calls `queryClient.clear()`. A key without scope cannot be written in a feature.

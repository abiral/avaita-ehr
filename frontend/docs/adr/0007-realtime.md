# ADR 0007: Server-sent events for realtime

Status: accepted

## Context

Critical lab results must reach clinicians without a page refresh. Updates flow one way, from server to client.

## Decision

Use server-sent events behind a `RealtimeChannel` port. Events carry only ids and types; handlers invalidate query keys and the UI refetches.

## Consequences

Works through proxies with plain HTTP. No PHI in event payloads. The adapter reconnects with backoff and closes on sign out.

## Review (F10)

Still holds. `result.critical` also feeds a persistent banner in the staff shell (`app/chart/useCriticalAlerts.ts`): it loads the result by id and shows it until the result is acknowledged. In tests the mock database's events are forwarded to the fake channel, so the same path is exercised without a browser.

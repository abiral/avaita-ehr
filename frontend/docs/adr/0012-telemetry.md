# ADR 0012: No telemetry until an ADR with PHI scrubbing

Status: accepted

## Context

Analytics and error tracking scripts can leak health data to third parties.

## Decision

No analytics, tag managers or error tracking SDKs. The `Logger` port redacts PHI fields. Adding telemetry later requires a new ADR describing PHI scrubbing.

## Consequences

Production debugging relies on the `X-Request-Id` header and backend logs.

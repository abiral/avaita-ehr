# ADR 0016: Search text travels in a header

Status: accepted

## Context

Section 3 forbids patient data in URLs. Doctor search (P5) and patient search (C4 booking on behalf, staff top bar) are free text that can contain a patient's name or MRN.

## Decision

Search text is sent in the `X-Search` request header, URI-encoded, never in the path or query string. `GET /patients` without the header returns the ward census (C3); with it, any facility patient by name, MRN or bed (at most 8). Patient search needs `chart:read` or `schedule:book-for-patient` at the active facility.

The query cache key includes the search text. The cache is memory only and is cleared on sign out, the 30 minute lock timeout and facility switch.

## Consequences

The real backend must read `X-Search` on these endpoints. The e2e PHI guard (`e2e/fixtures.ts`) fails any test that puts a seeded patient name or MRN in a page or request URL.

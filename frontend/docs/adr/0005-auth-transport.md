# ADR 0005: httpOnly session cookie and CSRF header

Status: accepted

## Context

Tokens reachable from JavaScript can be stolen by injected script. The app handles health data.

## Decision

The backend sets an httpOnly, Secure, SameSite session cookie. The frontend sends `credentials: 'include'` and an `X-CSRF-Token` header (from the `/session` response) on every non-GET request.

## Consequences

No token is ever stored in JavaScript or browser storage. The backend must issue and validate the CSRF token.

# ADR 0004: Reducers plus Context for client state

Status: accepted

## Context

Client state is small: booking flow steps, form drafts, the active tenant and session.

## Decision

Use pure reducers (state machines with exhaustive switches) and React Context with small hooks. No global state library.

## Consequences

State machines are pure and tested by their transition tables. Drafts live in memory only and are reset on sign out and facility switch.

# ADR 0009: CSS Modules over CSS variables

Status: accepted

## Context

The designs define their own components and a small token set. A runtime styling library adds weight and cost.

## Decision

Tokens live in `src/styles/tokens.css` as CSS variables. Components use CSS Modules that reference the variables. No inline style for layout.

## Consequences

No runtime styling cost. Visual changes to tokens propagate everywhere.

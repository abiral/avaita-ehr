# ADR 0009: CSS Modules over CSS variables

Status: accepted

## Context

The designs define their own components and a small token set. A runtime styling library adds weight and cost.

## Decision

Tokens live in `src/styles/tokens.css` as CSS variables. Components use CSS Modules that reference the variables. No inline style for layout.

## Consequences

No runtime styling cost. Visual changes to tokens propagate everywhere.

## Review (F10)

Still holds. Data-driven positions are the one exception to "no inline style": schedule grid rows (C4), supply bars (P9), range bar markers (P8) and chart coordinates set `style` from computed values. Everything else is in CSS Modules.

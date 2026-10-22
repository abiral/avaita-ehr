# ADR 0015: Frontend lives in the `frontend/` folder

Status: accepted

## Context

`codebase.md` describes a repository whose root is the frontend app. This repository also holds the design handoff in `design-files/` and may hold the backend later.

## Decision

The app lives in `frontend/`. The design sources stay in `design-files/docs/`. CI runs with `frontend/` as its working directory.

## Consequences

Paths in `codebase.md` such as `src/` and `api/openapi.yaml` are relative to `frontend/`.

# ADR 0001: One Vite SPA with three lazy-loaded areas

Status: accepted

## Context

The product has three areas (patient portal, clinician workspace, admin console) that share a design system, a session and tenancy rules. Patients use phones on slow networks; staff use desktops.

## Decision

Build one Vite single page app. Each area (`/portal`, `/staff`, `/admin`) is a lazy route chunk so the patient bundle never contains staff or admin code.

## Consequences

One design system, one session model and one build. Bundle size is guarded per area. If an area later needs independent deploys it can be split out along the existing route boundary.

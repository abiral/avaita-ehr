# ADR 0008: date-fns and @date-fns/tz, facility time zone for display

Status: accepted

## Context

Facilities may sit in zones such as Asia/Kathmandu (UTC+5:45). Browsers can be in any zone.

## Decision

The API sends UTC. Domain code uses `date-fns` and `TZDate` from `@date-fns/tz` with the facility zone for every scheduling rule. Display uses `Intl.DateTimeFormat` with an explicit `timeZone`.

## Consequences

The browser zone is never used for clinical or scheduling logic. Tests cover Asia/Kathmandu and a zone with daylight saving time.

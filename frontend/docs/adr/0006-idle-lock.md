# ADR 0006: Idle lock, staff 10 minutes, patients 15 minutes

Status: accepted

## Context

Clinical computers are shared. Patients may leave a phone unlocked.

## Decision

After 10 minutes of inactivity for staff, or 15 for patients, the app shows a lock screen that keeps the URL and asks for the password again. After 30 minutes locked the session ends. The timer uses an injected `Clock` so it can be tested.

## Consequences

Unsaved drafts survive the lock in memory only. Sign out and lock timeout clear the query cache and drafts.

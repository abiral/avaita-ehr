import type { PractitionerId } from '@/core/branded'
import { addLocalDays, atLocal, daysBetween, weekdayOfLocal } from '../time/zone'
import type { Handling, LocalDate, LocalTime, NewTimeOff, TimeOffKind, TimeOffReason } from './types'

export interface TimeOffDraft {
  readonly practitionerId: PractitionerId | null
  readonly kind: TimeOffKind
  readonly from: LocalDate
  readonly to: LocalDate
  readonly startTime: LocalTime
  readonly endTime: LocalTime
  readonly reason: TimeOffReason
  readonly patientNote: string
  readonly handling: Handling
  readonly coverPractitionerId: PractitionerId | null
}

export type DraftProblem = 'no-doctor' | 'end-before-start' | 'no-cover'

export function draftProblem(d: TimeOffDraft): DraftProblem | null {
  if (!d.practitionerId) return 'no-doctor'
  if (d.handling === 'reassign' && !d.coverPractitionerId) return 'no-cover'
  const days = daysBetween(d.from, d.to)
  if (days < 0 || (d.kind !== 'full' && d.endTime <= d.startTime)) return 'end-before-start'
  return null
}

/**
 * Turns the form into time-off ranges in the facility zone. Full days cover whole calendar days;
 * part of a day is one range; recurring repeats the time window weekly on the first date's weekday.
 */
export function toTimeOffRanges(d: TimeOffDraft, timeZone: string): NewTimeOff[] {
  if (!d.practitionerId) return []
  const base = {
    practitionerId: d.practitionerId,
    kind: d.kind,
    reason: d.reason,
    patientNote: d.patientNote,
    handling: d.handling,
    coverPractitionerId: d.handling === 'reassign' ? d.coverPractitionerId : null,
  }
  if (d.kind === 'full') {
    return [
      { ...base, start: atLocal(d.from, '00:00', timeZone), end: atLocal(addLocalDays(d.to, 1), '00:00', timeZone) },
    ]
  }
  const dates = d.kind === 'part' ? [d.from] : weeklyDates(d.from, d.to)
  return dates.map((date) => ({
    ...base,
    start: atLocal(date, d.startTime, timeZone),
    end: atLocal(date, d.endTime, timeZone),
  }))
}

const weeklyDates = (from: LocalDate, to: LocalDate): LocalDate[] => {
  const weekday = weekdayOfLocal(from)
  const span = Math.max(0, daysBetween(from, to))
  return Array.from({ length: span + 1 }, (_, i) => addLocalDays(from, i)).filter(
    (date) => weekdayOfLocal(date) === weekday,
  )
}

import { checkSlot, slotsOn, type BookabilityInput } from '@/domain/scheduling/bookable'
import type { AvailabilityBlock, LocalDate, TimeOff, VisitMode } from '@/domain/scheduling/types'
import type { BlockId, PractitionerId, TimeOffId } from '@/core/branded'
import type { Weekday } from '@/domain/scheduling/types'
import type { Db } from './db'

const KTM = 'Asia/Kathmandu'
export const facilityZone = (db: Db, facilityId: string): string =>
  db.facilities.find((f) => f.id === facilityId)?.timeZone ?? KTM

const ACTIVE = new Set(['booked', 'arrived'])

export const blocksOf = (db: Db, practitionerId: string): AvailabilityBlock[] =>
  db.blocks
    .filter((b) => b.practitionerId === practitionerId)
    .map((b) => ({
      ...b,
      id: b.id as BlockId,
      practitionerId: b.practitionerId as PractitionerId,
      weekday: b.weekday as Weekday,
    }))

export const timeOffOf = (db: Db, practitionerId: string): TimeOff[] =>
  db.timeOff
    .filter((t) => t.practitionerId === practitionerId)
    .map((t) => ({
      ...t,
      id: t.id as TimeOffId,
      practitionerId: t.practitionerId as PractitionerId,
      practitionerName: '',
      coverPractitionerId: t.coverPractitionerId as PractitionerId | null,
      start: new Date(t.start),
      end: new Date(t.end),
    }))

export const takenOf = (db: Db, practitionerId: string): Date[] =>
  db.appointments
    .filter((a) => a.practitionerId === practitionerId && ACTIVE.has(a.status))
    .map((a) => new Date(a.start))

/** Bookability input for a practitioner, built from the mock db (server-side rules). */
export function bookability(
  db: Db,
  practitionerId: string,
  mode: VisitMode,
  facilityId: string,
): Omit<BookabilityInput, 'start'> | null {
  const doc = db.practitioners.find((p) => p.id === practitionerId)
  if (!doc) return null
  return {
    mode,
    blocks: blocksOf(db, practitionerId),
    timeOff: timeOffOf(db, practitionerId),
    rules: db.rules,
    practitioner: doc,
    now: db.clock.now(),
    timeZone: facilityZone(db, facilityId),
    taken: takenOf(db, practitionerId),
  }
}

export const slotsFor = (input: Omit<BookabilityInput, 'start'>, dates: readonly LocalDate[]) =>
  dates.flatMap((d) => slotsOn(d, input))

export { checkSlot }

const PROBLEM_CODES = {
  'outside-availability': 'slot_outside_availability',
  'on-leave': 'practitioner_on_leave',
  'too-soon': 'slot_outside_availability',
  'too-far': 'slot_outside_availability',
  'mode-not-offered': 'mode_not_offered',
  taken: 'slot_taken',
} as const

export const slotProblemCode = (kind: keyof typeof PROBLEM_CODES): string => PROBLEM_CODES[kind]

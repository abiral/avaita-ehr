import type { Appointment } from '@/domain/appointments'
import type { LocalDate, TimeOff } from '@/domain/scheduling/types'
import { atLocal, localDateOf, localTimeOf, minutesOf, timeOf } from '@/domain/time'

export const DAY_START = '08:00'
export const DAY_END = '17:00'
/** Each grid row is ten minutes; an hour is six rows. */
export const ROW_MINUTES = 10
export const ROWS = (minutesOf(DAY_END) - minutesOf(DAY_START)) / ROW_MINUTES
const MIN_SPAN = 2

export type GridLook = 'booked' | 'done' | 'block' | 'cancelled'

export interface GridItem {
  readonly id: string
  readonly look: GridLook
  readonly row: number
  readonly span: number
  readonly start: Date
  readonly name: string
  readonly what: string
  readonly tag: 'seen' | 'arrived' | 'video' | 'noShow' | null
  readonly patientId: string | null
}

/** Grid row (1-based) for a moment on the given day, clamped to the visible hours. */
export function rowAt(at: Date, date: LocalDate, timeZone: string): number {
  if (localDateOf(at, timeZone) < date) return 1
  if (localDateOf(at, timeZone) > date) return ROWS + 1
  const offset = minutesOf(localTimeOf(at, timeZone)) - minutesOf(DAY_START)
  return Math.min(ROWS + 1, Math.max(1, Math.floor(offset / ROW_MINUTES) + 1))
}

const spanOf = (start: Date, end: Date, date: LocalDate, timeZone: string): number =>
  Math.max(MIN_SPAN, rowAt(end, date, timeZone) - rowAt(start, date, timeZone))

export const hourLabels = (): { readonly time: string; readonly row: number }[] =>
  Array.from({ length: ROWS / 6 }, (_, i) => ({ time: timeOf(minutesOf(DAY_START) + i * 60), row: i * 6 + 1 }))

const tagOf = (a: Appointment): GridItem['tag'] => {
  if (a.status === 'completed') return 'seen'
  if (a.status === 'arrived') return 'arrived'
  if (a.status === 'no_show') return 'noShow'
  return a.mode === 'remote' ? 'video' : null
}

const lookOf = (a: Appointment): GridLook => {
  if (a.status === 'cancelled') return 'cancelled'
  return a.status === 'booked' || a.status === 'arrived' ? 'booked' : 'done'
}

function appointmentItem(a: Appointment, date: LocalDate, timeZone: string, what: string): GridItem {
  return {
    id: a.id,
    look: lookOf(a),
    row: rowAt(a.start, date, timeZone),
    span: spanOf(a.start, a.end, date, timeZone),
    start: a.start,
    name: a.patientName,
    what,
    tag: a.status === 'cancelled' ? null : tagOf(a),
    patientId: a.patientId,
  }
}

function blockItem(
  o: TimeOff,
  date: LocalDate,
  timeZone: string,
  labels: { blocked: string; onLeave: string },
): GridItem {
  const full = o.kind === 'full'
  const start = full ? atLocal(date, DAY_START, timeZone) : o.start
  const end = full ? atLocal(date, DAY_END, timeZone) : o.end
  return {
    id: o.id,
    look: 'block',
    row: rowAt(start, date, timeZone),
    span: spanOf(start, end, date, timeZone),
    start,
    name: full ? labels.onLeave : o.impactNote,
    what: labels.blocked,
    tag: null,
    patientId: null,
  }
}

export interface ColumnInput {
  readonly appointments: readonly Appointment[]
  readonly timeOff: readonly TimeOff[]
  readonly date: LocalDate
  readonly timeZone: string
  readonly describe: (a: Appointment) => string
  readonly labels: { readonly blocked: string; readonly onLeave: string }
}

/** Items for one clinician column: time off first, then appointments; a cancelled slot rebooked by someone else is hidden. */
export function columnItems(input: ColumnInput): GridItem[] {
  const { date, timeZone } = input
  const live = input.appointments.filter((a) => a.status !== 'cancelled')
  const sameDay = input.appointments.filter((a) => localDateOf(a.start, timeZone) === date)
  const shown = sameDay.filter(
    (a) => a.status !== 'cancelled' || !live.some((b) => b.start.getTime() === a.start.getTime()),
  )
  const blocks = input.timeOff.map((o) => blockItem(o, date, timeZone, input.labels))
  const visits = shown.map((a) => appointmentItem(a, date, timeZone, input.describe(a)))
  return [...blocks, ...visits].sort((x, y) => x.start.getTime() - y.start.getTime())
}

/** Row of the current-time line, or null when now is outside the visible day. */
export function nowRow(now: Date, date: LocalDate, timeZone: string): number | null {
  if (localDateOf(now, timeZone) !== date) return null
  const minutes = minutesOf(localTimeOf(now, timeZone))
  if (minutes < minutesOf(DAY_START) || minutes >= minutesOf(DAY_END)) return null
  return (minutes - minutesOf(DAY_START)) / ROW_MINUTES + 1
}

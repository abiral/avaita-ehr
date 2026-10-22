import type { Appointment, AppointmentStatus } from './types'

export type Actor = 'patient' | 'staff'

/** Allowed status transitions and who can make them. */
export const APPOINTMENT_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly { to: AppointmentStatus; by: readonly Actor[] }[]>
> = {
  booked: [
    { to: 'cancelled', by: ['patient', 'staff'] },
    { to: 'arrived', by: ['staff'] },
    { to: 'no_show', by: ['staff'] },
  ],
  arrived: [{ to: 'completed', by: ['staff'] }],
  cancelled: [{ to: 'booked', by: ['patient', 'staff'] }],
  completed: [],
  no_show: [],
}

export const canTransition = (from: AppointmentStatus, to: AppointmentStatus, actor: Actor): boolean =>
  APPOINTMENT_TRANSITIONS[from].some((t) => t.to === to && t.by.includes(actor))

export type CancelCheck =
  { readonly ok: true } | { readonly ok: false; readonly reason: 'not-booked' | 'window-closed' | 'past' }

/** Patients may cancel only booked visits, and only before the cancellation cut-off. Staff may cancel any booked visit. */
export function cancellation(
  a: Pick<Appointment, 'status' | 'start'>,
  now: Date,
  cutoffMinutes: number,
  actor: Actor,
): CancelCheck {
  if (!canTransition(a.status, 'cancelled', actor)) return { ok: false, reason: 'not-booked' }
  if (a.start.getTime() <= now.getTime()) return { ok: false, reason: 'past' }
  if (actor === 'patient' && a.start.getTime() - now.getTime() < cutoffMinutes * 60_000)
    return { ok: false, reason: 'window-closed' }
  return { ok: true }
}

export const isUpcoming = (a: Pick<Appointment, 'status' | 'end'>, now: Date): boolean =>
  a.end.getTime() > now.getTime() && (a.status === 'booked' || a.status === 'arrived' || a.status === 'cancelled')

/** Upcoming first by time; past newest first. Cancelled visits in the past move to Past. */
export function splitAppointments(
  all: readonly Appointment[],
  now: Date,
): { upcoming: Appointment[]; past: Appointment[] } {
  const upcoming = all.filter((a) => isUpcoming(a, now)).sort((a, b) => a.start.getTime() - b.start.getTime())
  const past = all.filter((a) => !isUpcoming(a, now)).sort((a, b) => b.start.getTime() - a.start.getTime())
  return { upcoming, past }
}

export const nextAppointment = (all: readonly Appointment[], now: Date): Appointment | null =>
  splitAppointments(all, now).upcoming.find((a) => a.status === 'booked' || a.status === 'arrived') ?? null

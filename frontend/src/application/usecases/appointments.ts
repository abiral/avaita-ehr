import type { AppointmentId, PatientId } from '@/core/branded'
import type { Clock } from '@/core/clock'
import { AppError } from '@/core/errors'
import { cancellation, type Appointment, type CancelReason } from '@/domain/appointments'
import { checkSlot, type BookabilityInput, type SlotProblem } from '@/domain/scheduling/bookable'
import type { Practitioner, VisitMode } from '@/domain/scheduling/types'
import type { AppointmentRepository } from '../ports'
import { outcome, type Outcome } from './outcome'

const CODES: Readonly<Record<SlotProblem['kind'], string>> = {
  'outside-availability': 'slot_outside_availability',
  'on-leave': 'practitioner_on_leave',
  'too-soon': 'slot_outside_availability',
  'too-far': 'slot_outside_availability',
  'mode-not-offered': 'mode_not_offered',
  taken: 'slot_taken',
}

export const toRemoteCode = (p: SlotProblem): string => CODES[p.kind]

export interface BookInput {
  readonly practitioner: Practitioner
  readonly patientId: PatientId | null
  readonly mode: VisitMode
  readonly start: Date
  readonly reason: string
  readonly notifyBySms?: boolean
  /** Rules the frontend runs first to explain why before the server answers. */
  readonly context: Omit<BookabilityInput, 'start' | 'mode' | 'now' | 'practitioner'>
}

const assertBookable = (input: BookInput, now: Date) => {
  const check = checkSlot({
    ...input.context,
    start: input.start,
    mode: input.mode,
    practitioner: input.practitioner,
    now,
  })
  if (!check.ok) throw new AppError('Slot not bookable', toRemoteCode(check.error))
}

export const bookAppointment =
  (deps: { appointments: Pick<AppointmentRepository, 'book'>; clock: Clock }) =>
  async (input: BookInput): Promise<Outcome<Appointment>> => {
    assertBookable(input, deps.clock.now())
    const appointment = await deps.appointments.book({
      patientId: input.patientId,
      practitionerId: input.practitioner.id,
      start: input.start,
      mode: input.mode,
      reason: input.reason,
      ...(input.notifyBySms === undefined ? {} : { notifyBySms: input.notifyBySms }),
    })
    return outcome(appointment)
  }

export const rescheduleAppointment =
  (deps: { appointments: Pick<AppointmentRepository, 'reschedule'>; clock: Clock }) =>
  async (input: BookInput & { readonly appointmentId: AppointmentId }): Promise<Outcome<Appointment>> => {
    assertBookable(input, deps.clock.now())
    return outcome(await deps.appointments.reschedule(input.appointmentId, input.start))
  }

export const cancelAppointment =
  (deps: { appointments: Pick<AppointmentRepository, 'cancel'>; clock: Clock }) =>
  async (input: {
    appointment: Appointment
    reason: CancelReason
    cutoffMinutes: number
    actor: 'patient' | 'staff'
  }): Promise<Outcome<Appointment>> => {
    const check = cancellation(input.appointment, deps.clock.now(), input.cutoffMinutes, input.actor)
    if (!check.ok)
      throw new AppError('Cannot cancel', check.reason === 'window-closed' ? 'cancellation_window_closed' : 'conflict')
    return outcome(await deps.appointments.cancel(input.appointment.id, input.reason))
  }

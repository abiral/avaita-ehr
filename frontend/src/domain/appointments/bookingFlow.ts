import { assertNever } from '@/core/assertNever'
import type { AppointmentId, PractitionerId } from '@/core/branded'
import type { LocalDate, VisitMode } from '../scheduling/types'

/** P5 flow: search -> mode -> slot -> confirm -> submitting -> booked | failed. */
export type BookingStep = 'search' | 'mode' | 'slot' | 'confirm' | 'submitting' | 'booked' | 'failed'

export interface BookingState {
  readonly step: BookingStep
  readonly doctor: PractitionerId | null
  readonly mode: VisitMode | null
  readonly day: LocalDate | null
  readonly start: Date | null
  readonly appointmentId: AppointmentId | null
  readonly error: string | null
}

export type BookingEvent =
  | { readonly type: 'pick-doctor'; readonly doctor: PractitionerId; readonly mode: VisitMode | null }
  | { readonly type: 'pick-mode'; readonly mode: VisitMode }
  | { readonly type: 'pick-day'; readonly day: LocalDate }
  | { readonly type: 'pick-slot'; readonly start: Date }
  | { readonly type: 'next' }
  | { readonly type: 'back' }
  | { readonly type: 'submit' }
  | { readonly type: 'booked'; readonly appointmentId: AppointmentId }
  | { readonly type: 'failed'; readonly error: string }

export const initialBooking: BookingState = {
  step: 'search',
  doctor: null,
  mode: null,
  day: null,
  start: null,
  appointmentId: null,
  error: null,
}

/** Starts at the slot step for a reschedule (doctor and mode are fixed). */
export const rescheduleBooking = (doctor: PractitionerId, mode: VisitMode): BookingState => ({
  ...initialBooking,
  step: 'slot',
  doctor,
  mode,
})

const BACK: Partial<Record<BookingStep, BookingStep>> = {
  mode: 'search',
  slot: 'mode',
  confirm: 'slot',
  failed: 'slot',
}

const next = (s: BookingState): BookingState => {
  if (s.step === 'mode' && s.mode) return { ...s, step: 'slot' }
  if (s.step === 'slot' && s.start) return { ...s, step: 'confirm', error: null }
  return s
}

const pickMode = (s: BookingState, mode: VisitMode): BookingState =>
  s.mode === mode ? s : { ...s, mode, day: null, start: null }
const submit = (s: BookingState): BookingState =>
  s.step === 'confirm' && s.start ? { ...s, step: 'submitting', error: null } : s
const booked = (s: BookingState, appointmentId: AppointmentId): BookingState =>
  s.step === 'submitting' ? { ...s, step: 'booked', appointmentId } : s
const failed = (s: BookingState, error: string): BookingState =>
  s.step === 'submitting' ? { ...s, step: 'failed', start: null, error } : s
const back = (s: BookingState): BookingState => ({ ...s, step: BACK[s.step] ?? s.step, error: null })

/** Changing the doctor resets mode and slot; changing the mode resets the slot. */
export function bookingFlow(s: BookingState, e: BookingEvent): BookingState {
  switch (e.type) {
    case 'pick-doctor':
      return { ...initialBooking, step: 'mode', doctor: e.doctor, mode: e.mode }
    case 'pick-mode':
      return pickMode(s, e.mode)
    case 'pick-day':
      return { ...s, day: e.day, start: null, error: null }
    case 'pick-slot':
      return { ...s, start: e.start, error: null }
    case 'next':
      return next(s)
    case 'back':
      return back(s)
    case 'submit':
      return submit(s)
    case 'booked':
      return booked(s, e.appointmentId)
    case 'failed':
      return failed(s, e.error)
    default:
      return assertNever(e)
  }
}

/** Progress index for the 4-step indicator. */
export const STEP_INDEX: Readonly<Record<BookingStep, number>> = {
  search: 0,
  mode: 1,
  slot: 2,
  failed: 2,
  confirm: 3,
  submitting: 3,
  booked: 4,
}

import type { AppointmentId, PatientId, PractitionerId } from '@/core/branded'
import {
  bookingFlow,
  initialBooking,
  rescheduleBooking,
  STEP_INDEX,
  type BookingEvent,
  type BookingState,
} from './bookingFlow'
import { canTransition, cancellation, nextAppointment, splitAppointments } from './status'
import type { Appointment } from './types'

const pk = 'pr_karki' as PractitionerId
const t1 = new Date('2026-10-21T04:35:00Z')
const at = (step: BookingState['step'], patch: Partial<BookingState> = {}): BookingState => ({
  ...initialBooking,
  step,
  doctor: pk,
  mode: 'onsite',
  ...patch,
})

describe('bookingFlow transition table', () => {
  const rows: [string, BookingState, BookingEvent, BookingState][] = [
    ['pick a doctor', initialBooking, { type: 'pick-doctor', doctor: pk, mode: 'onsite' }, at('mode')],
    [
      'changing doctor resets mode and slot',
      at('confirm', { day: '2026-10-21', start: t1 }),
      { type: 'pick-doctor', doctor: 'pr_x' as PractitionerId, mode: null },
      { ...initialBooking, step: 'mode', doctor: 'pr_x' as PractitionerId },
    ],
    [
      'changing mode resets the slot',
      at('slot', { day: '2026-10-21', start: t1 }),
      { type: 'pick-mode', mode: 'remote' },
      at('slot', { mode: 'remote' }),
    ],
    [
      'same mode keeps the slot',
      at('slot', { start: t1 }),
      { type: 'pick-mode', mode: 'onsite' },
      at('slot', { start: t1 }),
    ],
    ['next from mode', at('mode'), { type: 'next' }, at('slot')],
    ['next from mode without a mode stays', at('mode', { mode: null }), { type: 'next' }, at('mode', { mode: null })],
    [
      'pick a day clears the slot',
      at('slot', { start: t1 }),
      { type: 'pick-day', day: '2026-10-22' },
      at('slot', { day: '2026-10-22' }),
    ],
    ['pick a slot', at('slot'), { type: 'pick-slot', start: t1 }, at('slot', { start: t1 })],
    ['next from slot', at('slot', { start: t1 }), { type: 'next' }, at('confirm', { start: t1 })],
    ['next from slot without a slot stays', at('slot'), { type: 'next' }, at('slot')],
    ['next from search stays', initialBooking, { type: 'next' }, initialBooking],
    ['back from confirm', at('confirm', { start: t1 }), { type: 'back' }, at('slot', { start: t1 })],
    ['back from mode', at('mode'), { type: 'back' }, at('search')],
    ['back from search stays', initialBooking, { type: 'back' }, initialBooking],
    ['submit', at('confirm', { start: t1 }), { type: 'submit' }, at('submitting', { start: t1 })],
    ['submit without slot stays', at('confirm'), { type: 'submit' }, at('confirm')],
    [
      'booked',
      at('submitting', { start: t1 }),
      { type: 'booked', appointmentId: 'ap_1' as AppointmentId },
      at('booked', { start: t1, appointmentId: 'ap_1' as AppointmentId }),
    ],
    [
      'booked ignored outside submitting',
      at('slot'),
      { type: 'booked', appointmentId: 'ap_1' as AppointmentId },
      at('slot'),
    ],
    [
      'failed clears the slot',
      at('submitting', { start: t1 }),
      { type: 'failed', error: 'taken' },
      at('failed', { error: 'taken' }),
    ],
    ['failed ignored outside submitting', at('slot'), { type: 'failed', error: 'x' }, at('slot')],
    ['back from failed', at('failed', { error: 'taken' }), { type: 'back' }, at('slot')],
  ]
  it.each(rows)('%s', (_, from, event, to) => {
    expect(bookingFlow(from, event)).toEqual(to)
  })
  it('starts a reschedule at the slot step and maps progress', () => {
    expect(rescheduleBooking(pk, 'remote')).toEqual(at('slot', { mode: 'remote' }))
    expect(STEP_INDEX.failed).toBe(STEP_INDEX.slot)
    expect(() => bookingFlow(initialBooking, { type: 'nope' } as never)).toThrow()
  })
})

const appt = (id: string, start: string, status: Appointment['status']): Appointment => ({
  id: id as AppointmentId,
  patientId: 'pt_1' as PatientId,
  patientName: 'Ramesh Pandey',
  practitionerId: pk,
  practitionerName: 'Dr. Prakash Karki',
  kind: 'consultation',
  title: 'Dr. Prakash Karki',
  reason: '',
  start: new Date(start),
  end: new Date(new Date(start).getTime() + 20 * 60_000),
  mode: 'onsite',
  status,
  location: '',
  preparation: '',
  cancelReason: null,
  cancelledBy: null,
  packageEnrollmentId: null,
  hasSummary: false,
})

describe('appointmentStatus', () => {
  const now = new Date('2026-10-20T08:35:00Z')
  it.each([
    ['booked', 'cancelled', 'patient', true],
    ['booked', 'arrived', 'patient', false],
    ['booked', 'arrived', 'staff', true],
    ['arrived', 'completed', 'staff', true],
    ['completed', 'cancelled', 'staff', false],
    ['cancelled', 'booked', 'patient', true],
    ['no_show', 'booked', 'staff', false],
  ] as const)('%s -> %s by %s is %s', (from, to, by, allowed) => {
    expect(canTransition(from, to, by)).toBe(allowed)
  })

  it('lets patients cancel only booked visits before the cut-off', () => {
    expect(cancellation(appt('a', '2026-10-21T04:35:00Z', 'booked'), now, 240, 'patient')).toEqual({ ok: true })
    expect(cancellation(appt('a', '2026-10-20T10:00:00Z', 'booked'), now, 240, 'patient')).toEqual({
      ok: false,
      reason: 'window-closed',
    })
    expect(cancellation(appt('a', '2026-10-20T10:00:00Z', 'booked'), now, 240, 'staff')).toEqual({ ok: true })
    expect(cancellation(appt('a', '2026-10-21T04:35:00Z', 'completed'), now, 240, 'patient')).toEqual({
      ok: false,
      reason: 'not-booked',
    })
    expect(cancellation(appt('a', '2026-10-19T04:35:00Z', 'booked'), now, 240, 'staff')).toEqual({
      ok: false,
      reason: 'past',
    })
  })

  it('splits upcoming and past and finds the next visit', () => {
    const all = [
      appt('p', '2026-10-19T02:00:00Z', 'completed'),
      appt('c', '2026-11-03T03:45:00Z', 'cancelled'),
      appt('u2', '2026-11-03T03:45:00Z', 'booked'),
      appt('u1', '2026-10-21T04:35:00Z', 'booked'),
      appt('old', '2026-08-14T05:15:00Z', 'cancelled'),
    ]
    const { upcoming, past } = splitAppointments(all, now)
    expect(upcoming.map((a) => a.id)).toEqual(['u1', 'c', 'u2'])
    expect(past.map((a) => a.id)).toEqual(['p', 'old'])
    expect(nextAppointment(all, now)?.id).toBe('u1')
    expect(nextAppointment([], now)).toBeNull()
  })
})

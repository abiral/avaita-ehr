import type { AppointmentId, BlockId, PatientId, PractitionerId } from '@/core/branded'
import type { Appointment } from '@/domain/appointments'
import type { Practitioner } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { bookAppointment, cancelAppointment, rescheduleAppointment, toRemoteCode } from './appointments'

const KTM = 'Asia/Kathmandu'
const clock = { now: () => new Date('2026-10-20T08:35:00Z') }
const doc: Practitioner = {
  id: 'pr_karki' as PractitionerId,
  displayName: 'Dr. Prakash Karki',
  category: 'Nephrology',
  qualifications: '',
  languages: [],
  keywords: [],
  offersOnsite: true,
  offersRemote: true,
  location: '',
  nextAvailableAt: null,
}
const context = {
  blocks: [
    {
      id: 'b' as BlockId,
      practitionerId: doc.id,
      weekday: 3 as const,
      start: '09:00',
      end: '12:00',
      slotMinutes: 20,
      mode: 'onsite' as const,
      room: null,
      repeat: 'weekly' as const,
      effectiveFrom: '2026-09-07',
    },
  ],
  timeOff: [],
  rules: { maxDaysAhead: 60, minNoticeMinutes: 120, cancelCutoffMinutes: 240, bufferMinutes: 0 },
  timeZone: KTM,
}
const ok = {
  practitioner: doc,
  patientId: null,
  mode: 'onsite' as const,
  start: atLocal('2026-10-21', '10:20', KTM),
  reason: 'Follow-up',
  context,
}
const appt = {
  id: 'ap_1' as AppointmentId,
  patientId: 'pt' as PatientId,
  status: 'booked',
  start: atLocal('2026-10-21', '10:20', KTM),
  end: atLocal('2026-10-21', '10:40', KTM),
} as Appointment

describe('appointment use cases', () => {
  it('books a bookable slot and refuses others before calling the server', async () => {
    const book = vi.fn(() => Promise.resolve(appt))
    await expect(bookAppointment({ appointments: { book }, clock })(ok)).resolves.toMatchObject({ value: appt })
    await expect(
      bookAppointment({ appointments: { book }, clock })({ ...ok, start: atLocal('2026-10-21', '12:20', KTM) }),
    ).rejects.toMatchObject({ code: 'slot_outside_availability' })
    expect(book).toHaveBeenCalledTimes(1)
    book.mockRejectedValueOnce(Object.assign(new Error('taken'), { code: 'slot_taken' }))
    await expect(bookAppointment({ appointments: { book }, clock })(ok)).rejects.toMatchObject({ code: 'slot_taken' })
  })

  it('reschedules after the same check', async () => {
    const reschedule = vi.fn(() => Promise.resolve(appt))
    await expect(
      rescheduleAppointment({ appointments: { reschedule }, clock })({ ...ok, appointmentId: appt.id }),
    ).resolves.toMatchObject({ value: appt })
    await expect(
      rescheduleAppointment({ appointments: { reschedule }, clock })({ ...ok, appointmentId: appt.id, mode: 'remote' }),
    ).rejects.toMatchObject({ code: 'slot_outside_availability' })
  })

  it('cancels only inside the window', async () => {
    const cancel = vi.fn(() => Promise.resolve({ ...appt, status: 'cancelled' as const }))
    const run = cancelAppointment({ appointments: { cancel }, clock })
    await expect(
      run({ appointment: appt, reason: 'feeling-better', cutoffMinutes: 240, actor: 'patient' }),
    ).resolves.toMatchObject({ value: { status: 'cancelled' } })
    const soon = { ...appt, start: new Date('2026-10-20T10:00:00Z') }
    await expect(
      run({ appointment: soon, reason: 'other', cutoffMinutes: 240, actor: 'patient' }),
    ).rejects.toMatchObject({ code: 'cancellation_window_closed' })
    await expect(
      run({ appointment: { ...appt, status: 'completed' }, reason: 'other', cutoffMinutes: 240, actor: 'patient' }),
    ).rejects.toMatchObject({ code: 'conflict' })
  })

  it('maps slot problems to remote codes', () => {
    expect(toRemoteCode({ kind: 'on-leave', until: new Date('2026-10-29T00:00:00Z') })).toBe('practitioner_on_leave')
    expect(toRemoteCode({ kind: 'mode-not-offered', mode: 'remote' })).toBe('mode_not_offered')
  })
})

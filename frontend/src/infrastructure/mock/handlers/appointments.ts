import { http, HttpResponse } from 'msw'
import { CANCEL_REASONS } from '@/domain/appointments/types'
import { emit, nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str, type Caller } from '../http'
import { bookability, checkSlot, slotProblemCode } from '../rules'
import { appointmentView } from '../views'

type SeedAppointment = Db['appointments'][number]

export interface BookRequest {
  readonly patientId: string
  readonly practitionerId: string
  readonly start: string
  readonly mode: 'onsite' | 'remote'
  readonly reason: string
  readonly enrollmentId: string | null
}

/** Creates an appointment after the server-side slot check; returns a problem response when not bookable. */
export function bookSlot(db: Db, caller: Caller, req: BookRequest): SeedAppointment | Response {
  const input = bookability(db, req.practitionerId, req.mode, caller.facilityId)
  if (!input) return problem(404, 'not_found', 'No such practitioner')
  const check = checkSlot({ ...input, start: new Date(req.start) })
  if (!check.ok) return problem(409, slotProblemCode(check.error.kind), 'Slot not bookable')
  const length = input.blocks.find((b) => b.mode === req.mode || b.mode === 'both')?.slotMinutes ?? 20
  const appt: SeedAppointment = {
    id: nextId(db, 'ap'),
    patientId: req.patientId,
    practitionerId: req.practitionerId,
    kind: 'consultation',
    title: '',
    reason: req.reason,
    start: new Date(req.start).toISOString(),
    minutes: length,
    mode: req.mode,
    status: 'booked',
    location: '',
    preparation: '',
    cancelReason: null,
    cancelledBy: null,
    packageEnrollmentId: req.enrollmentId,
    hasSummary: false,
  }
  db.appointments.push(appt)
  emit(db, 'appointment.changed', { appointmentId: appt.id })
  return appt
}

const ownAppointment = (db: Db, caller: Caller, id: string): SeedAppointment | Response => {
  const appt = db.appointments.find((a) => a.id === id)
  if (!appt) return problem(404, 'not_found', 'No such appointment')
  if (caller.kind === 'patient' && appt.patientId !== caller.userId)
    return problem(404, 'not_found', 'No such appointment')
  return appt
}

const beforeCutoff = (db: Db, appt: SeedAppointment): boolean =>
  new Date(appt.start).getTime() - db.clock.now().getTime() >= db.rules.cancelCutoffMinutes * 60_000

const replace = (db: Db, appt: SeedAppointment, patch: Partial<SeedAppointment>) => {
  const next = { ...appt, ...patch }
  db.appointments[db.appointments.indexOf(appt)] = next
  emit(db, 'appointment.changed', { appointmentId: appt.id })
  return HttpResponse.json(appointmentView(db, next))
}

function listHandler(db: Db, base: string) {
  return http.get(`${base}/appointments`, ({ request }) => {
    const caller = guard(db, request)
    if (isResponse(caller)) return caller
    const url = new URL(request.url)
    if (caller.kind === 'patient')
      return list(db.appointments.filter((a) => a.patientId === caller.userId).map((a) => appointmentView(db, a)))
    const practitionerId = url.searchParams.get('practitionerId')
    const from = new Date(url.searchParams.get('from') ?? 0).getTime()
    const to = new Date(url.searchParams.get('to') ?? '2100-01-01').getTime()
    const rows = db.appointments.filter(
      (a) =>
        a.practitionerId === practitionerId && new Date(a.start).getTime() >= from && new Date(a.start).getTime() < to,
    )
    return list(rows.map((a) => appointmentView(db, a)))
  })
}

const canBookForPatient = (db: Db, caller: Caller): boolean =>
  db.staff
    .find((s) => s.id === caller.userId)
    ?.memberships.some(
      (m) => m.facilityId === caller.facilityId && m.permissions.includes('schedule:book-for-patient'),
    ) ?? false

function bookHandler(db: Db, base: string) {
  return http.post(`${base}/appointments`, async ({ request }) => {
    const caller = guard(db, request)
    if (isResponse(caller)) return caller
    const body = await readJson(request)
    const patientId = caller.kind === 'patient' ? caller.userId : str(body, 'patientId')
    if (caller.kind === 'staff' && !canBookForPatient(db, caller))
      return problem(403, 'forbidden', 'Missing permission')
    if (caller.kind === 'staff' && !db.patients.some((p) => p.id === patientId))
      return problem(422, 'validation_failed', 'Patient required', { patientId: 'required' })
    const mode = str(body, 'mode') === 'remote' ? 'remote' : 'onsite'
    const created = bookSlot(db, caller, {
      patientId,
      practitionerId: str(body, 'practitionerId'),
      start: str(body, 'start'),
      mode,
      reason: str(body, 'reason'),
      enrollmentId: null,
    })
    return isResponse(created) ? created : HttpResponse.json(appointmentView(db, created), { status: 201 })
  })
}

function changeHandlers(db: Db, base: string) {
  return [
    http.post(`${base}/appointments/:id/cancel`, async ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const appt = ownAppointment(db, caller, String(params.id))
      if (isResponse(appt)) return appt
      const reason = str(await readJson(request), 'reason')
      if (appt.status !== 'booked') return problem(409, 'conflict', 'Only booked appointments can be cancelled')
      if (caller.kind === 'patient' && !beforeCutoff(db, appt))
        return problem(409, 'cancellation_window_closed', 'Too late to cancel online')
      const cancelReason = CANCEL_REASONS.find((r) => r === reason) ?? 'other'
      return replace(db, appt, { status: 'cancelled', cancelReason, cancelledBy: caller.kind })
    }),
    http.post(`${base}/appointments/:id/restore`, ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const appt = ownAppointment(db, caller, String(params.id))
      if (isResponse(appt)) return appt
      const taken = db.appointments.some(
        (a) =>
          a !== appt && a.practitionerId === appt.practitionerId && a.start === appt.start && a.status === 'booked',
      )
      if (appt.status !== 'cancelled' || taken || !beforeCutoff(db, appt))
        return problem(409, 'slot_taken', 'The slot is no longer available')
      return replace(db, appt, { status: 'booked', cancelReason: null, cancelledBy: null })
    }),
    http.post(`${base}/appointments/:id/reschedule`, async ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const appt = ownAppointment(db, caller, String(params.id))
      if (isResponse(appt)) return appt
      const start = str(await readJson(request), 'start')
      const created = bookSlot(db, caller, {
        patientId: appt.patientId,
        practitionerId: appt.practitionerId ?? '',
        start,
        mode: appt.mode,
        reason: appt.reason,
        enrollmentId: appt.packageEnrollmentId,
      })
      if (isResponse(created)) return created
      db.appointments[db.appointments.indexOf(appt)] = {
        ...appt,
        status: 'cancelled',
        cancelReason: 'other',
        cancelledBy: caller.kind,
      }
      return HttpResponse.json(appointmentView(db, created))
    }),
  ]
}

export function appointmentHandlers(db: Db, base: string) {
  return [listHandler(db, base), bookHandler(db, base), ...changeHandlers(db, base)]
}

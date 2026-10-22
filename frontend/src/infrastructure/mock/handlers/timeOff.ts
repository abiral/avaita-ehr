import { http, HttpResponse } from 'msw'
import { HANDLINGS, TIME_OFF_KINDS, TIME_OFF_REASONS } from '@/domain/scheduling/types'
import { overlaps } from '@/domain/time'
import { emit, nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str } from '../http'
import { bookability, slotsFor } from '../rules'
import { patientName, practitioner } from '../views'
import { addLocalDays, daysBetween, localDateOf } from '@/domain/time'

type SeedTimeOff = Db['timeOff'][number]

const oneOf = <T extends string>(values: readonly T[], v: string, fallback: T): T =>
  values.includes(v as T) ? (v as T) : fallback

const parse = (body: Record<string, unknown>) => ({
  practitionerId: str(body, 'practitionerId'),
  kind: oneOf(TIME_OFF_KINDS, str(body, 'kind'), 'full'),
  start: str(body, 'start'),
  end: str(body, 'end'),
  reason: oneOf(TIME_OFF_REASONS, str(body, 'reason'), 'other'),
  patientNote: str(body, 'patientNote'),
  handling: oneOf(HANDLINGS, str(body, 'handling'), 'notify'),
  coverPractitionerId: str(body, 'coverPractitionerId') || null,
})

const affected = (db: Db, input: ReturnType<typeof parse>) =>
  db.appointments.filter(
    (a) =>
      a.practitionerId === input.practitionerId &&
      a.status === 'booked' &&
      overlaps(
        new Date(a.start),
        new Date(new Date(a.start).getTime() + a.minutes * 60_000),
        new Date(input.start),
        new Date(input.end),
      ),
  )

const removedSlots = (db: Db, input: ReturnType<typeof parse>, facilityId: string): number =>
  (['onsite', 'remote'] as const).reduce((n, mode) => {
    const b = bookability(db, input.practitionerId, mode, facilityId)
    if (!b) return n
    const from = localDateOf(new Date(input.start), b.timeZone)
    const days = Math.max(0, daysBetween(from, localDateOf(new Date(input.end), b.timeZone)))
    const dates = Array.from({ length: days + 1 }, (_, i) => addLocalDays(from, i))
    const free = slotsFor({ ...b, timeOff: [] }, dates).filter(
      (s) => s.available && overlaps(s.start, s.end, new Date(input.start), new Date(input.end)),
    )
    return n + free.length
  }, 0)

const view = (db: Db, t: SeedTimeOff) => ({
  ...t,
  practitionerName: practitioner(db, t.practitionerId)?.displayName ?? '',
})

const apply = (db: Db, input: ReturnType<typeof parse>) => {
  for (const a of affected(db, input)) {
    const i = db.appointments.indexOf(a)
    if (input.handling === 'notify')
      db.appointments[i] = { ...a, status: 'cancelled', cancelledBy: 'staff', cancelReason: 'other' }
    if (input.handling === 'reassign' && input.coverPractitionerId)
      db.appointments[i] = { ...a, practitionerId: input.coverPractitionerId }
  }
}

export function timeOffHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/time-off`, ({ request }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const url = new URL(request.url)
      const from = new Date(url.searchParams.get('from') ?? 0)
      const to = new Date(url.searchParams.get('to') ?? '2100-01-01')
      return list(
        db.timeOff.filter((t) => overlaps(new Date(t.start), new Date(t.end), from, to)).map((t) => view(db, t)),
      )
    }),
    http.post(`${base}/time-off/impact-preview`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'schedule:admin' })
      if (isResponse(caller)) return caller
      const input = parse(await readJson(request))
      if (!(new Date(input.end) > new Date(input.start)))
        return problem(422, 'validation_failed', 'End before start', { end: 'before_start' })
      const rows = affected(db, input).map((a) => ({
        appointmentId: a.id,
        patientName: patientName(db, a.patientId),
        start: a.start,
      }))
      return HttpResponse.json({ affected: rows, removedSlots: removedSlots(db, input, caller.facilityId) })
    }),
    http.post(`${base}/time-off`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'schedule:admin' })
      if (isResponse(caller)) return caller
      const input = parse(await readJson(request))
      if (!(new Date(input.end) > new Date(input.start)))
        return problem(422, 'validation_failed', 'End before start', { end: 'before_start' })
      if (input.handling === 'reassign' && !input.coverPractitionerId)
        return problem(422, 'validation_failed', 'Cover required', { coverPractitionerId: 'required' })
      const count = affected(db, input).length
      apply(db, input)
      const created: SeedTimeOff = {
        ...input,
        id: nextId(db, 'to'),
        affectedCount: count,
        impactNote: count
          ? `${String(count)} appointments affected · patients notified just now`
          : 'No booked appointments affected',
      }
      db.timeOff.push(created)
      emit(db, 'time-off.created', { timeOffId: created.id })
      return HttpResponse.json(view(db, created))
    }),
  ]
}

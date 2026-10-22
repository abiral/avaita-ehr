import { createDb, type Db } from './db'
import { createHandlers } from './handlers'
import { DEMO_NOW, k } from './seed/time'
import { server } from '@/test/server'

const BASE = 'http://mock.test/api'

const setup = (who: 'patient' | 'staff' | 'admin' | null, now = DEMO_NOW): Db => {
  const db = createDb({ now: () => new Date(now) })
  server.use(...createHandlers(db, BASE))
  const users = {
    patient: ['patient', 'pt_ramesh'],
    staff: ['staff', 'st_anaya'],
    admin: ['staff', 'st_sarita'],
  } as const
  if (who) db.session = { kind: users[who][0], userId: users[who][1], locked: false }
  return db
}

const send = (path: string, init: { method?: string; body?: unknown; facility?: string; csrf?: boolean } = {}) =>
  fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Facility-Id': init.facility ?? 'fac_nvg',
      ...(init.csrf === false ? {} : { 'X-CSRF-Token': 'mock-csrf-token' }),
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  })

const code = async (res: Response) => ((await res.json()) as { code: string }).code

describe('mock server rules', () => {
  it('scopes by facility and checks session, CSRF and permissions', async () => {
    setup('patient')
    expect(await code(await send('/packages', { facility: 'fac_nve' }))).toBe('forbidden')
    expect(await code(await send('/appointments', { method: 'POST', body: {}, csrf: false }))).toBe('forbidden')
    expect(await code(await send('/patients'))).toBe('forbidden')
    setup(null)
    expect((await send('/packages')).status).toBe(401)
    const db = setup('staff')
    db.session = { kind: 'staff', userId: 'st_anaya', locked: true }
    expect((await send('/patients')).status).toBe(423)
  })

  it('only books slots inside blocks, outside time off and within the rules', async () => {
    setup('patient')
    const book = (start: string, practitionerId = 'pr_karki', mode = 'onsite') =>
      send('/appointments', {
        method: 'POST',
        body: { patientId: null, practitionerId, start, mode, reason: 'Follow-up' },
      })
    expect(await code(await book(k('2026-10-21', '12:20')))).toBe('slot_outside_availability')
    expect(await code(await book(k('2026-10-26', '09:00')))).toBe('practitioner_on_leave')
    expect(await code(await book(k('2026-10-21', '09:40')))).toBe('slot_taken')
    expect(await code(await book(k('2026-10-21', '10:00'), 'pr_suresh', 'remote'))).toBe('mode_not_offered')
    expect(await code(await book(k('2026-10-20', '15:00')))).toBe('slot_outside_availability')
    expect((await book(k('2026-10-21', '10:00'))).status).toBe(201)
    expect(await code(await book(k('2026-10-21', '10:00')))).toBe('slot_taken')
  })

  it('enforces the cancellation window and releases the slot', async () => {
    setup('patient', k('2026-10-21', '08:00'))
    expect(await code(await send('/appointments/ap_r1/cancel', { method: 'POST', body: { reason: 'other' } }))).toBe(
      'cancellation_window_closed',
    )
    expect(
      (await send('/appointments/ap_r3/cancel', { method: 'POST', body: { reason: 'feeling-better' } })).status,
    ).toBe(200)
    const slots = (await (
      await send(
        `/practitioners/pr_karki/slots?mode=onsite&from=${k('2026-11-03', '00:00')}&to=${k('2026-11-03', '23:00')}`,
      )
    ).json()) as { items: { start: string; available: boolean }[] }
    expect(slots.items.length).toBe(0)
    expect((await send('/appointments/ap_r3/restore', { method: 'POST' })).status).toBe(200)
  })

  it('moves refill requests through allowed transitions only', async () => {
    setup('patient')
    expect(
      (
        await send('/medication-requests', {
          method: 'POST',
          body: { medicationId: 'med_ator', quantityDays: 30, pickup: 'hospital-pharmacy', note: '' },
        })
      ).status,
    ).toBe(201)
    expect(
      await code(
        await send('/medication-requests', {
          method: 'POST',
          body: { medicationId: 'med_ator', quantityDays: 30, pickup: 'hospital-pharmacy', note: '' },
        }),
      ),
    ).toBe('refill_not_allowed')
    expect(
      await code(
        await send('/medication-requests', {
          method: 'POST',
          body: { medicationId: 'med_amox', quantityDays: 30, pickup: 'hospital-pharmacy', note: '' },
        }),
      ),
    ).toBe('refill_not_allowed')
  })

  it('decides a refill once and needs acknowledgement before releasing a critical result', async () => {
    setup('staff')
    expect(
      (
        await send('/medication-requests/rq_los/decision', {
          method: 'POST',
          body: { kind: 'decline', reason: 'Book a review', message: '' },
        })
      ).status,
    ).toBe(200)
    expect(
      await code(await send('/medication-requests/rq_los/decision', { method: 'POST', body: { kind: 'approve' } })),
    ).toBe('conflict')
    expect(await code(await send('/results/res_ram_renal/release', { method: 'POST', body: { comment: 'x' } }))).toBe(
      'conflict',
    )
    expect((await send('/results/res_ram_renal/acknowledge', { method: 'POST' })).status).toBe(200)
    expect((await send('/results/res_ram_renal/release', { method: 'POST', body: { comment: 'x' } })).status).toBe(200)
  })

  it('lists affected appointments for time off and notifies them on save', async () => {
    const db = setup('admin')
    const body = {
      practitionerId: 'pr_sabina',
      kind: 'full',
      start: k('2026-10-29', '00:00'),
      end: k('2026-10-31', '00:00'),
      reason: 'personal',
      patientNote: '',
      handling: 'notify',
      coverPractitionerId: null,
    }
    const preview = (await (await send('/time-off/impact-preview', { method: 'POST', body })).json()) as {
      affected: unknown[]
      removedSlots: number
    }
    expect(preview.affected).toHaveLength(4)
    expect(preview.removedSlots).toBe(20)
    expect((await send('/time-off', { method: 'POST', body })).status).toBe(200)
    expect(db.appointments.filter((a) => a.practitionerId === 'pr_sabina' && a.status === 'cancelled')).toHaveLength(4)
  })
})

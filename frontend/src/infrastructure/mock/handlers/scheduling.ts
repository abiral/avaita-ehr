import { http, HttpResponse } from 'msw'
import { validateNewBlocks } from '@/domain/scheduling/blocks'
import { addLocalDays, daysBetween, localDateOf } from '@/domain/time'
import type { Weekday } from '@/domain/scheduling/types'
import { nextId, type Db } from '../db'
import { guard, isResponse, list, noContent, problem, readJson } from '../http'
import { bookability, facilityZone, slotsFor } from '../rules'
import { timeOffHandlers } from './timeOff'

type NewBlock = Omit<Db['blocks'][number], 'id' | 'practitionerId'>

const parseBlocks = (body: Record<string, unknown>): NewBlock[] =>
  Array.isArray(body.blocks) ? (body.blocks as NewBlock[]) : []

function blockHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/practitioners/:id/availability-blocks`, ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      return list(db.blocks.filter((b) => b.practitionerId === params.id))
    }),
    http.post(`${base}/practitioners/:id/availability-blocks`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'schedule:admin' })
      if (isResponse(caller)) return caller
      const practitionerId = String(params.id)
      const blocks = parseBlocks(await readJson(request))
      const existing = db.blocks.filter((b) => b.practitionerId === practitionerId)
      const problemFound = validateNewBlocks(
        blocks.map((b) => ({ ...b, weekday: b.weekday as Weekday })),
        existing.map((b) => ({ ...b, weekday: b.weekday as Weekday })),
      )
      if (problemFound) return problem(422, 'validation_failed', 'Invalid block', { blocks: problemFound.kind })
      const created = blocks.map((b) => ({ ...b, id: nextId(db, 'blk'), practitionerId }))
      db.blocks.push(...created)
      return list(created)
    }),
    http.delete(`${base}/practitioners/:id/availability-blocks/:blockId`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'schedule:admin' })
      if (isResponse(caller)) return caller
      const i = db.blocks.findIndex((b) => b.id === params.blockId)
      if (i < 0) return problem(404, 'not_found', 'No such block')
      db.blocks.splice(i, 1)
      return noContent()
    }),
  ]
}

function slotHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/practitioners/:id/slots`, ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const url = new URL(request.url)
      const mode = url.searchParams.get('mode') === 'remote' ? 'remote' : 'onsite'
      const input = bookability(db, String(params.id), mode, caller.facilityId)
      if (!input) return problem(404, 'not_found', 'No such practitioner')
      const zone = facilityZone(db, caller.facilityId)
      const from = localDateOf(new Date(url.searchParams.get('from') ?? db.clock.now().toISOString()), zone)
      const to = localDateOf(new Date(url.searchParams.get('to') ?? db.clock.now().toISOString()), zone)
      const span = Math.min(62, Math.max(0, daysBetween(from, to)))
      const dates = Array.from({ length: span + 1 }, (_, i) => addLocalDays(from, i))
      const slots = slotsFor(input, dates).map((s) => ({
        ...s,
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      }))
      return list(slots)
    }),
    http.get(`${base}/booking-rules`, ({ request }) => {
      const caller = guard(db, request)
      return isResponse(caller) ? caller : HttpResponse.json(db.rules)
    }),
    http.put(`${base}/booking-rules`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'schedule:admin' })
      if (isResponse(caller)) return caller
      const body = await readJson(request)
      const num = (k: keyof Db['rules']) => (typeof body[k] === 'number' ? body[k] : db.rules[k])
      db.rules = {
        maxDaysAhead: num('maxDaysAhead'),
        minNoticeMinutes: num('minNoticeMinutes'),
        cancelCutoffMinutes: num('cancelCutoffMinutes'),
        bufferMinutes: num('bufferMinutes'),
      }
      return HttpResponse.json(db.rules)
    }),
  ]
}

export function schedulingHandlers(db: Db, base: string) {
  return [...blockHandlers(db, base), ...slotHandlers(db, base), ...timeOffHandlers(db, base)]
}

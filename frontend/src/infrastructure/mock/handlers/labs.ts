import { http, HttpResponse } from 'msw'
import { isCritical } from '@/domain/labs/flags'
import { PRIORITIES } from '@/domain/labs/types'
import { emit, nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str } from '../http'
import { inboxView, resultFlag, resultView } from '../clinicalViews'

type SeedResult = Db['results'][number]

/** A placed order produces a reported result right away in the mock; critical values raise a realtime event. */
function resultFromOrder(db: Db, patientId: string, codes: readonly string[], orderedBy: string): SeedResult | null {
  const latest = db.results.filter((r) => r.patientId === patientId).flatMap((r) => r.analytes)
  const analytes = latest.filter(
    (a) =>
      codes.includes(a.code) ||
      (codes.includes('RFP') && ['K', 'CREAT', 'EGFR', 'UREA', 'NA', 'HCO3'].includes(a.code)),
  )
  if (analytes.length === 0) return null
  const now = db.clock.now().toISOString()
  const bumped = analytes.map((a) => ({
    ...a,
    value: a.code === 'K' ? 6.3 : a.value,
    history: [...a.history, { at: now, value: a.value }],
  }))
  const unique = bumped.filter((a, i) => bumped.findIndex((b) => b.code === a.code) === i)
  return {
    id: nextId(db, 'res'),
    patientId,
    panel: codes.includes('RFP') ? 'Renal function panel' : 'Potassium, plasma',
    accession: `L-${String(db.sequence)}`,
    collectedAt: now,
    reportedAt: now,
    orderedBy,
    analytes: unique,
    preliminary: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    releasedToPatient: false,
    patientComment: '',
    seenByPatient: false,
  }
}

function orderHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/lab-catalogue`, ({ request }) => {
      const caller = guard(db, request, { kind: 'staff' })
      return isResponse(caller) ? caller : HttpResponse.json({ tests: db.labTests, orderSets: db.orderSets })
    }),
    http.get(`${base}/patients/:id/recent-collections`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      return isResponse(caller)
        ? caller
        : list(
            db.recentCollections
              .filter((c) => c.patientId === params.id)
              .map(({ testCode, collectedAt }) => ({ testCode, collectedAt })),
          )
    }),
    http.post(`${base}/lab-orders`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'order:write' })
      if (isResponse(caller)) return caller
      const body = await readJson(request)
      const items = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : []
      const patientId = str(body, 'patientId')
      const valid =
        items.length > 0 &&
        items.every(
          (i) =>
            db.labTests.some((t) => t.code === str(i, 'testCode')) && PRIORITIES.some((p) => p === str(i, 'priority')),
        )
      if (!valid || !str(body, 'indication'))
        return problem(422, 'validation_failed', 'Invalid order', { items: 'invalid' })
      const order = {
        id: nextId(db, 'ord'),
        patientId,
        placedAt: db.clock.now().toISOString(),
        itemCount: items.length,
      }
      db.labOrders.push(order)
      const result = resultFromOrder(
        db,
        patientId,
        items.map((i) => str(i, 'testCode')),
        caller.displayName,
      )
      if (result) {
        db.results.push(result)
        if (isCritical(resultFlag(result))) emit(db, 'result.critical', { resultId: result.id })
      }
      return HttpResponse.json(order, { status: 201 })
    }),
  ]
}

function reviewHandlers(db: Db, base: string) {
  const find = (id: unknown) => db.results.find((r) => r.id === id)
  const replace = (r: SeedResult, patch: Partial<SeedResult>) => {
    const next = { ...r, ...patch }
    db.results[db.results.indexOf(r)] = next
    return HttpResponse.json(resultView(db, next))
  }
  return [
    http.get(`${base}/results/inbox`, ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'result:review' })
      if (isResponse(caller)) return caller
      const ward = db.patients.filter((p) => p.facilityId === caller.facilityId && p.bed).map((p) => p.id)
      return list(db.results.filter((r) => ward.includes(r.patientId)).map((r) => inboxView(db, r)))
    }),
    http.get(`${base}/patients/:id/results`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      return isResponse(caller)
        ? caller
        : list(db.results.filter((r) => r.patientId === params.id).map((r) => inboxView(db, r)))
    }),
    http.get(`${base}/results/:id`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      if (isResponse(caller)) return caller
      const r = find(params.id)
      return r ? HttpResponse.json(resultView(db, r)) : problem(404, 'not_found', 'No such result')
    }),
    http.post(`${base}/results/:id/acknowledge`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'result:review' })
      if (isResponse(caller)) return caller
      const r = find(params.id)
      if (!r) return problem(404, 'not_found', 'No such result')
      return r.acknowledgedBy
        ? HttpResponse.json(resultView(db, r))
        : replace(r, { acknowledgedBy: caller.displayName, acknowledgedAt: db.clock.now().toISOString() })
    }),
    http.post(`${base}/results/:id/release`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'result:release' })
      if (isResponse(caller)) return caller
      const r = find(params.id)
      if (!r) return problem(404, 'not_found', 'No such result')
      if (isCritical(resultFlag(r)) && !r.acknowledgedBy)
        return problem(409, 'conflict', 'Acknowledge a critical result before releasing it')
      return replace(r, {
        releasedToPatient: true,
        patientComment: str(await readJson(request), 'comment'),
        seenByPatient: false,
      })
    }),
  ]
}

function portalHandler(db: Db, base: string) {
  return http.get(`${base}/me/reports`, ({ request }) => {
    const caller = guard(db, request, { kind: 'patient' })
    if (isResponse(caller)) return caller
    const mine = db.results.filter((r) => r.patientId === caller.userId && r.releasedToPatient)
    const items = mine
      .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
      .map((r) => ({
        id: r.id,
        panel: r.panel,
        collectedAt: r.collectedAt,
        orderedBy: r.orderedBy,
        reviewedBy: r.acknowledgedBy,
        isNew: !r.seenByPatient,
        comment: r.patientComment,
        analytes: r.analytes.map(({ history: _h, ...a }) => a),
      }))
    return list(items)
  })
}

export function labHandlers(db: Db, base: string) {
  return [...orderHandlers(db, base), ...reviewHandlers(db, base), portalHandler(db, base)]
}

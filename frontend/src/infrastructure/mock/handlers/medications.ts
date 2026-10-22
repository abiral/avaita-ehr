import { http, HttpResponse } from 'msw'
import type { MedicationRequestId, PatientId } from '@/core/branded'
import { firedChecks, unacknowledged } from '@/domain/medications/safetyChecks'
import { PICKUPS, type RefillRequest } from '@/domain/medications/types'
import { nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str } from '../http'

type SeedMedication = Db['medications'][number]
type SeedRefill = Db['refills'][number]

const OPEN = new Set(['requested', 'under-review'])

const medicationView = (db: Db, m: SeedMedication) => {
  const open = [...db.refills]
    .reverse()
    .find((r) => r.medicationId === m.id && r.status !== 'declined' && r.status !== 'delivered')
  return {
    id: m.id,
    name: m.name,
    instructions: m.instructions,
    indication: m.indication,
    prescriber: m.prescriber,
    daysLeft: m.daysLeft,
    supplyDays: m.supplyDays,
    status: m.status,
    endedAt: m.endedAt,
    openRequest: open ? { id: open.id, requestedAt: open.requestedAt, status: open.status } : null,
  }
}

const LAB_CODES = ['K', 'EGFR', 'CREAT']

const refillView = (db: Db, r: SeedRefill) => {
  const m = db.medications.find((x) => x.id === r.medicationId)
  const p = db.patients.find((x) => x.id === m?.patientId)
  const labs = db.results
    .filter((x) => x.patientId === p?.id)
    .flatMap((x) =>
      x.analytes
        .filter((a) => LAB_CODES.includes(a.code))
        .map((a) => ({ code: a.code, value: a.value, at: x.collectedAt })),
    )
  return {
    id: r.id,
    patientId: p?.id ?? '',
    patientName: p?.displayName ?? '',
    patientSex: p?.sex ?? ('other' as const),
    patientBirthDate: p?.birthDate ?? '1970-01-01',
    mrn: p?.mrn ?? '',
    medicationName: m?.name ?? '',
    instructions: m?.instructions ?? '',
    indication: m?.indication ?? '',
    lastDispensed: m?.lastDispensed ?? null,
    quantityDays: r.quantityDays,
    pickup: r.pickup,
    note: r.note,
    allergies: (db.allergies[p?.id ?? ''] ?? []).map((a) => a.substance),
    requestedAt: r.requestedAt,
    status: r.status,
    decidedBy: r.decidedBy,
    decidedAt: r.decidedAt,
    labs,
    drugClass: m?.drugClass ?? '',
  }
}

const DECIDED = { approve: 'approved', change: 'changed', decline: 'declined' } as const

/** The same request the frontend sees, with dates, so the server runs the same safety checks. */
const asRequest = (db: Db, r: SeedRefill): RefillRequest => {
  const v = refillView(db, r)
  return {
    ...v,
    id: v.id as MedicationRequestId,
    patientId: v.patientId as PatientId,
    lastDispensed: v.lastDispensed ? { at: new Date(v.lastDispensed.at), quantity: v.lastDispensed.quantity } : null,
    requestedAt: new Date(v.requestedAt),
    decidedAt: v.decidedAt ? new Date(v.decidedAt) : null,
    labs: v.labs.map((l) => ({ ...l, at: new Date(l.at) })),
  }
}

export function medicationHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/me/medications`, ({ request }) => {
      const caller = guard(db, request, { kind: 'patient' })
      if (isResponse(caller)) return caller
      const meds = db.medications.filter((m) => m.patientId === caller.userId).map((m) => medicationView(db, m))
      return HttpResponse.json({
        allergies: (db.allergies[caller.userId] ?? []).map((a) => a.substance),
        medications: meds,
      })
    }),
    http.post(`${base}/medication-requests`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'patient' })
      if (isResponse(caller)) return caller
      const body = await readJson(request)
      const med = db.medications.find((m) => m.id === str(body, 'medicationId') && m.patientId === caller.userId)
      const pickup = PICKUPS.find((p) => p === str(body, 'pickup'))
      const quantityDays = Number(body.quantityDays)
      if (!med || !pickup || ![30, 60, 90].includes(quantityDays))
        return problem(422, 'validation_failed', 'Invalid request', { medicationId: 'invalid' })
      const open = db.refills.some((r) => r.medicationId === med.id && OPEN.has(r.status))
      if (med.status !== 'active' || open) return problem(409, 'refill_not_allowed', 'Refill not allowed')
      db.refills.push({
        id: nextId(db, 'rq'),
        medicationId: med.id,
        quantityDays,
        pickup,
        note: str(body, 'note'),
        requestedAt: db.clock.now().toISOString(),
        status: 'requested',
        decidedBy: null,
        decidedAt: null,
      })
      return HttpResponse.json(medicationView(db, med), { status: 201 })
    }),
    http.get(`${base}/medication-requests`, ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'refill:decide' })
      if (isResponse(caller)) return caller
      return list(
        [...db.refills].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)).map((r) => refillView(db, r)),
      )
    }),
    http.post(`${base}/medication-requests/:id/decision`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'refill:decide' })
      if (isResponse(caller)) return caller
      const i = db.refills.findIndex((r) => r.id === params.id)
      const current = db.refills[i]
      if (!current) return problem(404, 'not_found', 'No such request')
      if (!OPEN.has(current.status)) return problem(409, 'conflict', 'Already decided')
      const body = await readJson(request)
      const kind = str(body, 'kind')
      if (kind !== 'approve' && kind !== 'change' && kind !== 'decline')
        return problem(422, 'validation_failed', 'Invalid decision', { kind: 'invalid' })
      const acknowledged = Array.isArray(body.acknowledgedChecks) ? body.acknowledgedChecks.map(String) : []
      if (
        kind === 'approve' &&
        unacknowledged(firedChecks(asRequest(db, current), db.clock.now()), acknowledged).length > 0
      )
        return problem(409, 'refill_not_allowed', 'Confirm the safety checks before approving')
      const next: SeedRefill = {
        ...current,
        status: DECIDED[kind],
        decidedBy: caller.displayName,
        decidedAt: db.clock.now().toISOString(),
      }
      db.refills[i] = next
      return HttpResponse.json(refillView(db, next))
    }),
  ]
}

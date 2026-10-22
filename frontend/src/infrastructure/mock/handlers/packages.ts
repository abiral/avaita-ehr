import { http, HttpResponse } from 'msw'
import { canChooseFormat, firstVisitMode } from '@/domain/packages/formats'
import { PACKAGE_FORMATS } from '@/domain/packages/types'
import { nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str, type Caller } from '../http'
import { packageView } from '../views'
import { bookSlot } from './appointments'

type SeedPackage = Db['packages'][number]

const isAdmin = (db: Db, caller: Caller): boolean =>
  caller.kind === 'staff' &&
  Boolean(
    db.staff
      .find((s) => s.id === caller.userId)
      ?.memberships.some((m) => m.facilityId === caller.facilityId && m.permissions.includes('package:admin')),
  )

const parseDraft = (
  body: Record<string, unknown>,
  fallback?: SeedPackage,
): Omit<SeedPackage, 'id' | 'bookedCount'> | null => {
  const format = PACKAGE_FORMATS.find((f) => f === str(body, 'format')) ?? fallback?.format
  const items = Array.isArray(body.items) ? (body.items as SeedPackage['items']) : fallback?.items
  const validityDays = typeof body.validityDays === 'number' ? body.validityDays : fallback?.validityDays
  const name = str(body, 'name') || (fallback?.name ?? '')
  const practitionerId = str(body, 'practitionerId') || (fallback?.practitionerId ?? '')
  if (!format || !items || !validityDays || !name || !practitionerId) return null
  const published = typeof body.published === 'boolean' ? body.published : (fallback?.published ?? false)
  return { practitionerId, name, description: str(body, 'description'), format, validityDays, published, items }
}

function adminHandlers(db: Db, base: string) {
  return [
    http.post(`${base}/packages`, async ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'package:admin' })
      if (isResponse(caller)) return caller
      const draft = parseDraft(await readJson(request))
      if (!draft) return problem(422, 'validation_failed', 'Missing fields', { name: 'required' })
      const created: SeedPackage = { ...draft, id: nextId(db, 'pkg'), bookedCount: 0 }
      db.packages.push(created)
      return HttpResponse.json(packageView(db, created), { status: 201 })
    }),
    http.patch(`${base}/packages/:id`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'package:admin' })
      if (isResponse(caller)) return caller
      const i = db.packages.findIndex((p) => p.id === params.id)
      const current = db.packages[i]
      if (!current) return problem(404, 'not_found', 'No such package')
      const draft = parseDraft(await readJson(request), current)
      if (!draft) return problem(422, 'validation_failed', 'Missing fields', { name: 'required' })
      db.packages[i] = { ...current, ...draft }
      return HttpResponse.json(packageView(db, db.packages[i] ?? current))
    }),
    http.post(`${base}/packages/:id/publish`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'package:admin' })
      if (isResponse(caller)) return caller
      const i = db.packages.findIndex((p) => p.id === params.id)
      const current = db.packages[i]
      if (!current) return problem(404, 'not_found', 'No such package')
      db.packages[i] = { ...current, published: true }
      return HttpResponse.json(packageView(db, db.packages[i] ?? current))
    }),
  ]
}

function enrollHandler(db: Db, base: string) {
  return http.post(`${base}/package-enrollments`, async ({ request }) => {
    const caller = guard(db, request, { kind: 'patient' })
    if (isResponse(caller)) return caller
    const body = await readJson(request)
    const pkg = db.packages.find((p) => p.id === str(body, 'packageId') && p.published)
    if (!pkg) return problem(409, 'package_unavailable', 'Package not available')
    const chosen = PACKAGE_FORMATS.find((f) => f === str(body, 'chosenFormat'))
    if (!chosen || !canChooseFormat(pkg, chosen)) return problem(409, 'mode_not_offered', 'Format not offered')
    const visit = (body.firstVisit ?? {}) as Record<string, unknown>
    const mode = firstVisitMode(chosen)
    if (str(visit, 'mode') !== mode) return problem(409, 'mode_not_offered', 'First visit mode not allowed')
    const enrollmentId = nextId(db, 'enr')
    const appt = bookSlot(db, caller, {
      patientId: caller.userId,
      practitionerId: pkg.practitionerId,
      start: str(visit, 'start'),
      mode,
      reason: pkg.name,
      enrollmentId,
    })
    if (isResponse(appt)) return appt
    const start = db.clock.now()
    const enrollment = {
      id: enrollmentId,
      patientId: caller.userId,
      packageId: pkg.id,
      chosenFormat: chosen,
      start: start.toISOString(),
      expires: new Date(start.getTime() + pkg.validityDays * 86_400_000).toISOString(),
      firstAppointmentId: appt.id,
    }
    db.enrollments.push(enrollment)
    db.packages[db.packages.indexOf(pkg)] = { ...pkg, bookedCount: pkg.bookedCount + 1 }
    const { patientId: _omit, ...dto } = enrollment
    return HttpResponse.json(dto, { status: 201 })
  })
}

export function packageHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/packages`, ({ request }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const all = isAdmin(db, caller)
      return list(db.packages.filter((p) => all || p.published).map((p) => packageView(db, p)))
    }),
    ...adminHandlers(db, base),
    enrollHandler(db, base),
  ]
}

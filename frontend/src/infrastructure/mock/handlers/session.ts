import { http, HttpResponse } from 'msw'
import type { Db } from '../db'
import { problem, readJson, str } from '../http'

const facilityDto = (db: Db, id: string) => {
  const f = db.facilities.find((x) => x.id === id)
  return f ? { id: f.id, name: f.name, shortName: f.shortName, city: f.city, timeZone: f.timeZone } : null
}

export function sessionDto(db: Db) {
  const s = db.session
  if (!s) return null
  const organization = { id: db.org.id, name: db.org.name }
  if (s.kind === 'patient') {
    const account = db.patientAccounts.find((a) => a.patientId === s.userId)
    const p = db.patients.find((x) => x.id === s.userId)
    if (!account || !p) return null
    const facilities = account.facilityIds.map((id) => facilityDto(db, id)).filter((f) => f !== null)
    return {
      kind: 'patient' as const,
      csrfToken: db.csrfToken,
      organization,
      patient: { id: p.id, displayName: p.displayName, givenName: p.givenName, mrn: p.mrn },
      facilities,
    }
  }
  const staff = db.staff.find((x) => x.id === s.userId)
  if (!staff) return null
  const memberships = staff.memberships.flatMap((m) => {
    const facility = facilityDto(db, m.facilityId)
    return facility ? [{ facility, role: m.role, departments: m.departments, permissions: m.permissions }] : []
  })
  return {
    kind: 'staff' as const,
    csrfToken: db.csrfToken,
    organization,
    staff: { id: staff.id, displayName: staff.displayName, title: staff.title },
    memberships,
  }
}

const findUser = (db: Db, kind: string, identifier: string) => {
  const id = identifier.trim().toLowerCase()
  if (kind === 'staff') return db.staff.find((s) => s.email === id)?.id
  return db.patientAccounts.find((a) => a.email === id || a.phone === id)?.patientId
}

export function sessionHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/session`, () => {
      const dto = sessionDto(db)
      if (!dto) return problem(401, 'unauthenticated', 'Sign in required')
      if (db.session?.locked) return problem(423, 'session_locked', 'Session locked')
      return HttpResponse.json(dto)
    }),
    http.post(`${base}/session`, async ({ request }) => {
      const body = await readJson(request)
      const kind = str(body, 'kind') === 'staff' ? 'staff' : 'patient'
      const userId = findUser(db, kind, str(body, 'identifier'))
      if (!userId || str(body, 'password').length < 4) return problem(401, 'invalid_credentials', 'Invalid credentials')
      db.session = { kind, userId, locked: false }
      return HttpResponse.json(sessionDto(db))
    }),
    http.delete(`${base}/session`, () => {
      db.session = null
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${base}/session/unlock`, async ({ request }) => {
      const body = await readJson(request)
      if (!db.session) return problem(401, 'unauthenticated', 'Sign in required')
      if (str(body, 'password').length < 4) return problem(401, 'invalid_credentials', 'Invalid credentials')
      db.session.locked = false
      return HttpResponse.json(sessionDto(db))
    }),
    http.post(`${base}/password-reset`, async ({ request }) => {
      const body = await readJson(request)
      const id = str(body, 'identifier').trim()
      const masked = id.includes('@')
        ? id.replace(/^(.)[^@]*?(\.[^@]*)?@/, (_m, first: string, rest?: string) => `${first}•••••${rest ?? ''}@`)
        : `•••• ${id.slice(-3)}`
      return HttpResponse.json({ maskedDestination: masked })
    }),
    http.post(`${base}/password-reset/confirm`, async ({ request }) => {
      const body = await readJson(request)
      // Demo: the emailed link is not available in the mock, so an empty token stands in for it.
      const token = str(body, 'token')
      if (token && !db.resetTokens.has(token))
        return problem(422, 'validation_failed', 'Invalid link', { token: 'expired' })
      if (str(body, 'password').length < 10 || !/\d/.test(str(body, 'password')))
        return problem(422, 'validation_failed', 'Weak password', { password: 'too_short' })
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

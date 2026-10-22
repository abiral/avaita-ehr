import { http, HttpResponse } from 'msw'
import type { Db } from '../db'
import { guard, isResponse, list, problem } from '../http'
import { FACILITY_STATS, ONBOARDING, ROLES, SETTINGS } from '../seed/organization'

const detail = (db: Db, facilityId: string, note: string | null) => {
  const f = db.facilities.find((x) => x.id === facilityId)
  const s = FACILITY_STATS[facilityId]
  if (!f || !s) return null
  return {
    id: f.id,
    name: f.name,
    code: s.code,
    type: s.type,
    kind: f.kind,
    beds: s.beds,
    staffCount: s.staffCount,
    patientCount: s.patientCount,
    status: f.status,
    membershipNote: note,
  }
}

export function tenancyHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/me/facilities`, () => {
      const session = db.session
      if (!session) return problem(401, 'unauthenticated', 'Sign in required')
      const staff = db.staff.find((s) => s.id === session.userId)
      const rows = db.facilities.map((f) => {
        const m = staff?.memberships.find((x) => x.facilityId === f.id)
        return m || f.status === 'onboarding' ? detail(db, f.id, m?.note ?? null) : null
      })
      return list(rows.filter((r) => r !== null))
    }),
    http.get(`${base}/organization`, ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'org:admin' })
      if (isResponse(caller)) return caller
      const facilities = db.facilities.map((f) => detail(db, f.id, null)).filter((r) => r !== null)
      return HttpResponse.json({ facilities, onboarding: ONBOARDING, settings: SETTINGS, roles: ROLES })
    }),
  ]
}

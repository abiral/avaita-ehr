import { HttpResponse } from 'msw'
import type { Db } from './db'

export const problem = (status: number, code: string, title: string, fields?: Record<string, string>) =>
  HttpResponse.json(
    { type: 'about:blank', title, status, code, ...(fields ? { fields } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

export const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export const str = (body: Record<string, unknown>, key: string): string => {
  const v = body[key]
  return typeof v === 'string' ? v : ''
}

export interface Caller {
  readonly kind: 'patient' | 'staff'
  readonly userId: string
  readonly facilityId: string
}

/** Enforces session, CSRF on writes and tenant scoping like the real backend would. */
export function authorize(db: Db, request: Request): Caller | Response {
  const session = db.session
  if (!session) return problem(401, 'unauthenticated', 'Sign in required')
  if (session.locked) return problem(423, 'session_locked', 'Session locked')
  if (request.method !== 'GET' && request.headers.get('X-CSRF-Token') !== db.csrfToken) {
    return problem(403, 'forbidden', 'Missing CSRF token')
  }
  const facilityId = request.headers.get('X-Facility-Id') ?? ''
  const allowed =
    session.kind === 'staff'
      ? db.staff.find((s) => s.id === session.userId)?.memberships.some((m) => m.facilityId === facilityId)
      : db.patientAccounts.find((a) => a.patientId === session.userId)?.facilityIds.includes(facilityId)
  if (!allowed) return problem(403, 'forbidden', 'No access to this facility')
  return { kind: session.kind, userId: session.userId, facilityId }
}

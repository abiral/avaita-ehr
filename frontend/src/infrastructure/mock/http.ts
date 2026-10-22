import { HttpResponse } from 'msw'
import type { Permission } from '@/domain/identity'
import type { Db } from './db'

export const problem = (status: number, code: string, title: string, fields?: Record<string, string>) =>
  HttpResponse.json(
    { type: 'about:blank', title, status, code, ...(fields ? { fields } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

export const list = (items: readonly unknown[]) => HttpResponse.json({ items, nextCursor: null })
export const noContent = () => new HttpResponse(null, { status: 204 })

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
  readonly displayName: string
}

const sessionProblem = (db: Db, request: Request): Response | null => {
  const session = db.session
  if (!session) return problem(401, 'unauthenticated', 'Sign in required')
  if (session.locked) return problem(423, 'session_locked', 'Session locked')
  if (request.method !== 'GET' && request.headers.get('X-CSRF-Token') !== db.csrfToken) {
    return problem(403, 'forbidden', 'Missing CSRF token')
  }
  return null
}

const permissionsAt = (db: Db, userId: string, facilityId: string): readonly Permission[] | null =>
  db.staff.find((s) => s.id === userId)?.memberships.find((m) => m.facilityId === facilityId)?.permissions ?? null

export interface GuardOptions {
  readonly kind?: 'patient' | 'staff'
  readonly permission?: Permission
}

/** Session, CSRF on writes, tenant scoping and permission checks, like the real backend. */
export function guard(db: Db, request: Request, options: GuardOptions = {}): Caller | Response {
  const blocked = sessionProblem(db, request)
  if (blocked || !db.session) return blocked ?? problem(401, 'unauthenticated', 'Sign in required')
  const { kind, userId } = db.session
  const facilityId = request.headers.get('X-Facility-Id') ?? ''
  if (options.kind && options.kind !== kind) return problem(403, 'forbidden', 'Wrong account type')
  const perms = kind === 'staff' ? permissionsAt(db, userId, facilityId) : null
  const patientOk =
    kind === 'patient' && db.patientAccounts.some((a) => a.patientId === userId && a.facilityIds.includes(facilityId))
  if (!perms && !patientOk) return problem(403, 'forbidden', 'No access to this facility')
  if (options.permission && !perms?.includes(options.permission)) return problem(403, 'forbidden', 'Missing permission')
  const displayName =
    kind === 'staff'
      ? (db.staff.find((s) => s.id === userId)?.displayName ?? '')
      : (db.patients.find((p) => p.id === userId)?.displayName ?? '')
  return { kind, userId, facilityId, displayName }
}

export const isResponse = (v: unknown): v is Response => v instanceof Response

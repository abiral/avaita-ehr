import { ApiError } from '@/core/errors'
import type { Emitter } from '@/core/events'
import type { TenantScope } from '@/core/tenant'
import { withHeaders, type Interceptor } from './types'

export interface SessionSignals {
  sessionEnded: undefined
  sessionLocked: undefined
}

/** 401 ends the session, 423 locks it. The error is rethrown either way. */
export const sessionGuard =
  (events: Pick<Emitter<SessionSignals>, 'emit'>): Interceptor =>
  (next) =>
  async (req) => {
    try {
      return await next(req)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && !req.path.startsWith('/session'))
        events.emit('sessionEnded', undefined)
      if (e instanceof ApiError && e.status === 423) events.emit('sessionLocked', undefined)
      throw e
    }
  }

export const tenantHeaders =
  (tenant: { current(): TenantScope | null }): Interceptor =>
  (next) =>
  (req) => {
    const scope = tenant.current()
    if (!scope) return next(req)
    return next(withHeaders(req, { 'X-Organization-Id': scope.organizationId, 'X-Facility-Id': scope.facilityId }))
  }

export const csrf =
  (token: { current(): string | null }): Interceptor =>
  (next) =>
  (req) => {
    const value = token.current()
    if (req.method === 'GET' || !value) return next(req)
    return next(withHeaders(req, { 'X-CSRF-Token': value }))
  }

const randomId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)

/** Random id for support tickets. Contains no PHI. */
export const requestId =
  (makeId: () => string = randomId): Interceptor =>
  (next) =>
  (req) =>
    next(withHeaders(req, { 'X-Request-Id': makeId() }))

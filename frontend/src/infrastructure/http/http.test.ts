import { z } from 'zod'
import { ApiError, AppError, SchemaError } from '@/core/errors'
import { createEmitter } from '@/core/events'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import { createHttpClient } from './client'
import { csrf, requestId, sessionGuard, tenantHeaders, type SessionSignals } from './interceptors'
import { problemJson } from './problemJson'
import { timeout } from './timeout'
import type { Handler, HttpRequest } from './types'

const ok = (body: unknown, status = 200) => ({ status, headers: new Headers(), body })
const get: HttpRequest = { method: 'GET', path: '/x' }

describe('interceptors', () => {
  it('adds tenant headers from the current scope', async () => {
    let scope: { organizationId: OrganizationId; facilityId: FacilityId } | null = null
    const seen: HttpRequest[] = []
    const terminal: Handler = (req) => {
      seen.push(req)
      return Promise.resolve(ok({}))
    }
    const h = tenantHeaders({ current: () => scope })(terminal)
    await h(get)
    scope = { organizationId: 'o1' as OrganizationId, facilityId: 'f1' as FacilityId }
    await h(get)
    expect(seen[0]?.headers).toBeUndefined()
    expect(seen[1]?.headers).toEqual({ 'X-Organization-Id': 'o1', 'X-Facility-Id': 'f1' })
  })

  it('sends csrf only on non-GET requests and a request id always', async () => {
    const seen: HttpRequest[] = []
    const terminal: Handler = (req) => {
      seen.push(req)
      return Promise.resolve(ok({}))
    }
    const h = csrf({ current: () => 'tok' })(requestId(() => 'rid')(terminal))
    await h(get)
    await h({ method: 'POST', path: '/x', body: {} })
    expect(seen[0]?.headers).toEqual({ 'X-Request-Id': 'rid' })
    expect(seen[1]?.headers).toEqual({ 'X-CSRF-Token': 'tok', 'X-Request-Id': 'rid' })
    const none = csrf({ current: () => null })(terminal)
    await none({ method: 'POST', path: '/y' })
    expect(seen[2]?.headers).toBeUndefined()
  })

  it('maps problem+json to ApiError with fields', async () => {
    const h = problemJson()(() =>
      Promise.resolve(ok({ title: 'Taken', code: 'slot_taken', fields: { start: 'Taken', n: 1 } }, 409)),
    )
    const e = await h(get).catch((x: unknown) => x)
    expect(e).toBeInstanceOf(ApiError)
    expect(e).toMatchObject({ code: 'slot_taken', status: 409, fields: { start: 'Taken' } })
  })

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation_failed'],
    [423, 'session_locked'],
    [500, 'unknown'],
  ])('maps status %i without a body to %s', async (status, code) => {
    const h = problemJson()(() => Promise.resolve(ok('oops', status)))
    await expect(h(get)).rejects.toMatchObject({ code, message: `HTTP ${status}` })
  })

  it('maps a rejected fetch to network_error and keeps AppErrors', async () => {
    const h = problemJson()(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(h(get)).rejects.toMatchObject({ code: 'network_error' })
    const h2 = problemJson()(() => Promise.reject(new AppError('t', 'timeout')))
    await expect(h2(get)).rejects.toMatchObject({ code: 'timeout' })
  })

  it('emits sessionEnded on 401 and sessionLocked on 423', async () => {
    const events = createEmitter<SessionSignals>()
    const seen: string[] = []
    events.on('sessionEnded', () => seen.push('ended'))
    events.on('sessionLocked', () => seen.push('locked'))
    const fail = (status: number) => sessionGuard(events)(() => Promise.reject(new ApiError('x', 'x', status)))
    await expect(fail(401)(get)).rejects.toBeInstanceOf(ApiError)
    await expect(fail(423)(get)).rejects.toBeInstanceOf(ApiError)
    await expect(fail(401)({ method: 'POST', path: '/session' })).rejects.toBeInstanceOf(ApiError)
    await expect(fail(500)(get)).rejects.toBeInstanceOf(ApiError)
    expect(seen).toEqual(['ended', 'locked'])
  })

  it('times out and tells timeout from caller abort', async () => {
    vi.useFakeTimers()
    const hang: Handler = (req) =>
      new Promise((_, reject) => {
        req.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })
    const p = timeout(100)(hang)(get)
    vi.advanceTimersByTime(101)
    await expect(p).rejects.toMatchObject({ code: 'timeout' })
    const controller = new AbortController()
    const p2 = timeout(100)(hang)({ ...get, signal: controller.signal })
    controller.abort()
    await expect(p2).rejects.toMatchObject({ code: 'aborted' })
    const pre = new AbortController()
    pre.abort()
    await expect(timeout(100)(hang)({ ...get, signal: pre.signal })).rejects.toMatchObject({ code: 'aborted' })
    await expect(timeout(100)(() => Promise.reject(new Error('boom')))(get)).rejects.toThrow('boom')
    vi.useRealTimers()
  })
})

describe('http client', () => {
  it('parses with the schema and throws SchemaError on mismatch', async () => {
    const client = createHttpClient([], () => Promise.resolve(ok({ id: 'a' })))
    await expect(client.send(get, z.object({ id: z.string() }))).resolves.toEqual({ id: 'a' })
    await expect(client.send(get, z.object({ id: z.number() }))).rejects.toBeInstanceOf(SchemaError)
    await expect(client.sendVoid(get)).resolves.toBeUndefined()
  })
})

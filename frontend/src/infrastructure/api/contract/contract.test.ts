/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createDb, type Db } from '@/infrastructure/mock/db'
import { createHandlers } from '@/infrastructure/mock/handlers'
import { DEMO_NOW } from '@/infrastructure/mock/seed/time'
import { server } from '@/test/server'
import { ENDPOINTS, type Endpoint, type Who } from './index'
import { buildOpenApi } from './openapi'
import { toYaml } from './yaml'

const BASE = 'http://contract.test/api'
const FILE = resolve(__dirname, '../../../../api/openapi.yaml')
const USERS: Record<Exclude<Who, 'none'>, { kind: 'patient' | 'staff'; userId: string }> = {
  patient: { kind: 'patient', userId: 'pt_ramesh' },
  staff: { kind: 'staff', userId: 'st_anaya' },
  admin: { kind: 'staff', userId: 'st_sarita' },
}

const fill = (path: string, params: Readonly<Record<string, string>> = {}) =>
  path.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? k)

const headersFor = (e: Endpoint) => ({
  'Content-Type': 'application/json',
  'X-Organization-Id': 'org_northvale',
  'X-Facility-Id': 'fac_nvg',
  'X-CSRF-Token': 'mock-csrf-token',
  ...e.headers,
})

async function call(db: Db, e: Endpoint): Promise<Response> {
  db.session = e.as === 'none' ? null : { ...USERS[e.as], locked: false }
  for (const step of e.before ?? []) {
    await fetch(`${BASE}${step.path}`, {
      method: 'POST',
      headers: headersFor(e),
      body: JSON.stringify(step.body ?? {}),
    })
  }
  const qs = e.query ? `?${new URLSearchParams(e.query).toString()}` : ''
  return fetch(`${BASE}${fill(e.path, e.params)}${qs}`, {
    method: e.method.toUpperCase(),
    headers: headersFor(e),
    ...(e.body === undefined ? {} : { body: JSON.stringify(e.body) }),
  })
}

const examples: Record<string, unknown> = {}

describe('API contract', () => {
  it.each(ENDPOINTS.filter((e) => e.request).map((e) => [e.id, e] as const))(
    'request example for %s matches its schema',
    (_, e) => {
      expect(e.request?.safeParse(e.body).error?.issues ?? []).toEqual([])
    },
  )

  it.each(ENDPOINTS.filter((e) => !e.stream).map((e) => [e.id, e] as const))(
    'mock answers %s with a valid response',
    async (_, e) => {
      const db = createDb({ now: () => new Date(DEMO_NOW) })
      server.use(...createHandlers(db, BASE))
      const res = await call(db, e)
      expect(res.status).toBe(e.status)
      if (!e.response) return
      const body: unknown = await res.json()
      const parsed = e.response.safeParse(body)
      expect(parsed.error?.issues ?? []).toEqual([])
      examples[e.id] = body
    },
  )

  it('api/openapi.yaml is generated from the registry and its examples are valid', () => {
    const yaml = toYaml(buildOpenApi(ENDPOINTS, examples))
    if (process.env.UPDATE_CONTRACT) writeFileSync(FILE, yaml)
    expect(readFileSync(FILE, 'utf8')).toBe(yaml)
  })
})

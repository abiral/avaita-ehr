import type { PatientId } from '@/core/branded'
import type { OrganizationId } from '@/core/tenant'
import type { PatientSession } from '@/domain/identity'
import { sessionOf, sessionReducer, type SessionAction, type SessionState } from './sessionState'
import { createSessionStore } from './sessionStore'

const patient: PatientSession = {
  kind: 'patient',
  patientId: 'pt_1' as PatientId,
  displayName: 'Ramesh Pandey',
  givenName: 'Ramesh',
  mrn: 'NVG-188240',
  organizationId: 'org_1' as OrganizationId,
  organizationName: 'Northvale Health',
  facilities: [],
  csrfToken: 'csrf-1',
}
const at = new Date('2026-10-20T03:00:00Z')
const loading: SessionState = { status: 'loading' }
const signedOut: SessionState = { status: 'signed-out' }
const active: SessionState = { status: 'active', session: patient }
const locked: SessionState = { status: 'locked', session: patient, lockedAt: at }

describe('sessionReducer transition table', () => {
  const cases: [string, SessionState, SessionAction, SessionState][] = [
    ['loaded with session', loading, { type: 'loaded', session: patient }, active],
    ['loaded without session', loading, { type: 'loaded', session: null }, signedOut],
    ['late load is ignored', active, { type: 'loaded', session: null }, active],
    ['sign in', signedOut, { type: 'signed-in', session: patient }, active],
    ['sign out from active', active, { type: 'signed-out' }, signedOut],
    ['sign out from locked', locked, { type: 'signed-out' }, signedOut],
    ['lock when active', active, { type: 'locked', at }, locked],
    ['lock ignored when signed out', signedOut, { type: 'locked', at }, signedOut],
    ['unlock when locked', locked, { type: 'unlocked', session: patient }, active],
    ['unlock ignored when active', active, { type: 'unlocked', session: patient }, active],
  ]
  it.each(cases)('%s', (_, from, action, to) => {
    expect(sessionReducer(from, action)).toEqual(to)
  })

  it('reads the session out of any state', () => {
    expect(sessionOf(active)).toBe(patient)
    expect(sessionOf(locked)).toBe(patient)
    expect(sessionOf(signedOut)).toBeNull()
  })

  it('rejects unknown actions', () => {
    expect(() => sessionReducer(active, { type: 'nope' } as never)).toThrow()
  })
})

describe('session store', () => {
  it('notifies, resolves ready and exposes the csrf token', async () => {
    const store = createSessionStore()
    const seen: string[] = []
    const off = store.subscribe(() => seen.push(store.get().status))
    const ready = store.ready()
    expect(store.csrfToken()).toBeNull()
    store.dispatch({ type: 'loaded', session: patient })
    await expect(ready).resolves.toEqual(active)
    await expect(store.ready()).resolves.toEqual(active)
    expect(store.csrfToken()).toBe('csrf-1')
    store.dispatch({ type: 'unlocked', session: patient })
    off()
    store.dispatch({ type: 'signed-out' })
    expect(seen).toEqual(['active'])
  })
})

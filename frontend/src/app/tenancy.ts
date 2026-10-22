import type { PreferenceStore } from '@/application/ports'
import type { FacilityId, TenantScope } from '@/core/tenant'
import { needsFacilityChoice, type FacilitySummary, type Session } from '@/domain/identity'
import type { SessionStore } from './session/sessionStore'
import type { TenantSource } from './tenantSource'

export const facilitiesOf = (session: Session): readonly FacilitySummary[] =>
  session.kind === 'patient' ? session.facilities : session.memberships.map((m) => m.facility)

/** The scope a session starts in: the one facility, or the remembered facility if it is still allowed. */
export function initialScope(session: Session, lastFacilityId: string | undefined): TenantScope | null {
  const facilities = facilitiesOf(session)
  const remembered = facilities.find((f) => f.id === lastFacilityId)
  const single = session.kind === 'staff' && !needsFacilityChoice(session) ? facilities[0] : undefined
  const patientDefault = session.kind === 'patient' ? (remembered ?? facilities[0]) : undefined
  const chosen = single ?? patientDefault ?? remembered
  return chosen ? { organizationId: session.organizationId, facilityId: chosen.id } : null
}

/** Keeps the tenant in step with the session before any route guard reads it. */
export function wireTenant(store: SessionStore, tenant: TenantSource, prefs: PreferenceStore): () => void {
  return store.subscribe(() => {
    const state = store.get()
    if (state.status === 'signed-out') {
      tenant.set(null)
      return
    }
    if (state.status !== 'active' || tenant.current()) return
    const scope = initialScope(state.session, prefs.get('lastFacilityId'))
    if (scope) tenant.set(scope)
  })
}

export const facilityById = (session: Session | null, id: FacilityId | undefined): FacilitySummary | null =>
  (session && id ? facilitiesOf(session).find((f) => f.id === id) : undefined) ?? null

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { FacilityId, TenantScope } from '@/core/tenant'
import { membershipFor, type Department, type FacilitySummary, type StaffMembership } from '@/domain/identity'
import { useServices } from './ServicesProvider'
import { clearUserData } from './session/clearUserData'
import { sessionOf } from './session/sessionState'
import { useSession } from './session/SessionProvider'
import { facilityById } from './tenancy'

export interface TenantApi {
  readonly scope: TenantScope | null
  readonly facility: FacilitySummary | null
  readonly department: Department | null
  readonly membership: StaffMembership | null
  /** Facility IANA zone used for every displayed time. */
  readonly timeZone: string
  readonly select: (facilityId: FacilityId, departmentId?: string) => void
}

const TenantContext = createContext<TenantApi | null>(null)
const DEFAULT_ZONE = 'Asia/Kathmandu'

export function TenantProvider({ children }: { readonly children: ReactNode }) {
  const services = useServices()
  const { tenant, prefs, events } = services
  const { state } = useSession()
  const snap = useSyncExternalStore(tenant.subscribe, tenant.snapshot)
  const session = sessionOf(state)
  const facility = facilityById(session, snap.scope?.facilityId)
  const membership =
    session?.kind === 'staff' && snap.scope ? (membershipFor(session, snap.scope.facilityId) ?? null) : null
  const department =
    membership?.departments.find((d) => d.id === snap.departmentId) ?? membership?.departments[0] ?? null
  const select = useCallback(
    (facilityId: FacilityId, departmentId?: string) => {
      if (!session) return
      const previous = tenant.current()
      if (previous && previous.facilityId !== facilityId) clearUserData(services)
      const scope = { organizationId: session.organizationId, facilityId }
      tenant.set(scope, departmentId ?? null)
      prefs.set('lastFacilityId', facilityId)
      if (previous?.facilityId !== facilityId) events.emit('facilityChanged', facilityId)
    },
    [session, tenant, prefs, events, services],
  )
  const api = useMemo<TenantApi>(
    () => ({
      scope: snap.scope,
      facility,
      department,
      membership,
      timeZone: facility?.timeZone ?? DEFAULT_ZONE,
      select,
    }),
    [snap.scope, facility, department, membership, select],
  )
  return <TenantContext.Provider value={api}>{children}</TenantContext.Provider>
}

export function useTenant(): TenantApi {
  const api = useContext(TenantContext)
  if (!api) throw new Error('useTenant needs TenantProvider')
  return api
}

/** For screens behind a facility guard: the scope is always set there. */
export function useScope(): TenantScope {
  const { scope } = useTenant()
  if (!scope) throw new Error('No active facility')
  return scope
}

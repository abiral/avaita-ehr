import { useEffect } from 'react'
import type { StaffSession } from '@/domain/identity'
import { useServices } from '../ServicesProvider'
import { useSession } from '../session/SessionProvider'
import { sessionOf } from '../session/sessionState'
import { useTenant } from '../TenantProvider'

/** Staff session plus tenant, and the realtime connection for the active facility. */
export function useStaffContext() {
  const { realtime } = useServices()
  const { state, signOut } = useSession()
  const tenant = useTenant()
  const session = sessionOf(state)
  const staff: StaffSession | null = session?.kind === 'staff' ? session : null
  const { scope } = tenant
  useEffect(() => {
    if (!scope) return
    realtime.connect(scope)
    return () => {
      realtime.close()
    }
  }, [scope, realtime])
  return { staff, tenant, signOut }
}

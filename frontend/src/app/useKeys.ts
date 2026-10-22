import { useScope } from './TenantProvider'
import { scopedKeys, type ScopedKeys } from './queryKeys'

/** Query keys for the active facility. Only usable under a facility guard. */
export function useKeys(): ScopedKeys {
  return scopedKeys(useScope())
}

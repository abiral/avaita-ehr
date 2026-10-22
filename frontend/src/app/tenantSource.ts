import type { TenantScope } from '@/core/tenant'

export interface TenantSnapshot {
  readonly scope: TenantScope | null
  readonly departmentId: string | null
}

export interface TenantSource {
  readonly current: () => TenantScope | null
  readonly snapshot: () => TenantSnapshot
  readonly set: (scope: TenantScope | null, departmentId?: string | null) => void
  readonly subscribe: (fn: () => void) => () => void
}

export function createTenantSource(): TenantSource {
  const box: { snap: TenantSnapshot } = { snap: { scope: null, departmentId: null } }
  const listeners = new Set<() => void>()
  return {
    current: () => box.snap.scope,
    snapshot: () => box.snap,
    set: (scope, departmentId = null) => {
      box.snap = { scope, departmentId }
      listeners.forEach((fn) => {
        fn()
      })
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

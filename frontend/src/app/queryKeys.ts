import type { TenantScope } from '@/core/tenant'

/** Every query key starts with the facility or organization scope (section 4). */
export const scopedKeys = (s: TenantScope) => {
  const f = ['f', s.facilityId] as const
  const o = ['o', s.organizationId] as const
  return {
    facility: f,
    organization: o,
    facilities: [...o, 'facilities'] as const,
  }
}
export type ScopedKeys = ReturnType<typeof scopedKeys>

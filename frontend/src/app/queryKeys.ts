import type { OrganizationId, TenantScope } from '@/core/tenant'

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

/** Organization-level keys for data read before a facility is chosen (C1). */
export const organizationKeys = (organizationId: OrganizationId) => {
  const o = ['o', organizationId] as const
  return { myFacilities: [...o, 'me', 'facilities'] as const }
}

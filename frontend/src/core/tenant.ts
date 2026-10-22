import type { Branded } from './branded'

export type OrganizationId = Branded<string, 'OrganizationId'>
export type FacilityId = Branded<string, 'FacilityId'>
export interface TenantScope {
  readonly organizationId: OrganizationId
  readonly facilityId: FacilityId
}

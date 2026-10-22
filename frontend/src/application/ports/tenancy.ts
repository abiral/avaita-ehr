import type { FacilityDetail, OrganizationOverview } from '@/domain/identity'

export interface TenancyRepository {
  myFacilities(signal?: AbortSignal): Promise<FacilityDetail[]>
  organization(signal?: AbortSignal): Promise<OrganizationOverview>
}

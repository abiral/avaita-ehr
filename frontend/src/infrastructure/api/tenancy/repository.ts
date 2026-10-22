import type { TenancyRepository } from '@/application/ports'
import type { FacilityId } from '@/core/tenant'
import type { FacilityDetail } from '@/domain/identity'
import type { z } from 'zod'
import type { HttpClient } from '../../http'
import { FacilityDetailListDto, OrganizationDto, type FacilityDetailDto } from './dto'

const toFacilityDetail = (dto: z.infer<typeof FacilityDetailDto>): FacilityDetail => ({
  ...dto,
  id: dto.id as FacilityId,
})

export function createTenancyRepository(http: HttpClient): TenancyRepository {
  return {
    async myFacilities(signal) {
      const res = await http.send({ method: 'GET', path: '/me/facilities', signal }, FacilityDetailListDto)
      return res.items.map(toFacilityDetail)
    },
    async organization(signal) {
      const res = await http.send({ method: 'GET', path: '/organization', signal }, OrganizationDto)
      const onboarding = res.onboarding
        ? { ...res.onboarding, goLive: res.onboarding.goLive ? new Date(res.onboarding.goLive) : null }
        : null
      return { ...res, onboarding, facilities: res.facilities.map(toFacilityDetail) }
    },
  }
}

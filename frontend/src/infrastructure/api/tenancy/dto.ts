import { z } from 'zod'
import { IsoDateTime, listOf } from '../common'

export const FacilityDetailDto = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  kind: z.string(),
  beds: z.number().int().nullable(),
  staffCount: z.number().int().min(0),
  patientCount: z.number().int().nullable(),
  status: z.enum(['live', 'onboarding']),
  membershipNote: z.string().nullable(),
})
export const FacilityDetailListDto = listOf(FacilityDetailDto)

export const OrganizationDto = z.object({
  facilities: z.array(FacilityDetailDto),
  onboarding: z
    .object({
      facilityName: z.string(),
      goLive: IsoDateTime.nullable(),
      steps: z.array(
        z.object({
          title: z.string(),
          detail: z.string(),
          state: z.enum(['done', 'in-progress', 'next', 'planned']),
          progress: z.string(),
        }),
      ),
    })
    .nullable(),
  settings: z.array(
    z.object({ name: z.string(), scope: z.enum(['organization', 'organization-overridable', 'facility']) }),
  ),
  roles: z.array(z.object({ role: z.string(), access: z.record(z.string(), z.string()) })),
})

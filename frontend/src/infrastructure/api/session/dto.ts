import { z } from 'zod'
import { PERMISSIONS } from '@/domain/identity'
import { FacilityDto } from '../common'

const OrganizationDto = z.object({ id: z.string(), name: z.string() })

export const PatientSessionDto = z.object({
  kind: z.literal('patient'),
  csrfToken: z.string(),
  organization: OrganizationDto,
  patient: z.object({ id: z.string(), displayName: z.string(), givenName: z.string(), mrn: z.string() }),
  facilities: z.array(FacilityDto),
})

export const StaffSessionDto = z.object({
  kind: z.literal('staff'),
  csrfToken: z.string(),
  organization: OrganizationDto,
  staff: z.object({ id: z.string(), displayName: z.string(), title: z.string() }),
  memberships: z.array(
    z.object({
      facility: FacilityDto,
      role: z.string(),
      departments: z.array(z.object({ id: z.string(), name: z.string(), unit: z.string() })),
      permissions: z.array(z.enum(PERMISSIONS)),
    }),
  ),
})

export const SessionDto = z.discriminatedUnion('kind', [PatientSessionDto, StaffSessionDto])
export type SessionDto = z.infer<typeof SessionDto>

export const SignInBody = z.object({
  kind: z.enum(['patient', 'staff']),
  identifier: z.string(),
  password: z.string(),
})

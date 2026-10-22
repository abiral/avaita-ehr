import type { PatientId, StaffId } from '@/core/branded'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { FacilitySummary, Session } from '@/domain/identity'
import type { FacilityDto } from '../common'
import type { SessionDto } from './dto'

export const toFacility = (dto: FacilityDto): FacilitySummary => ({ ...dto, id: dto.id as FacilityId })

export function toSession(dto: SessionDto): Session {
  const organizationId = dto.organization.id as OrganizationId
  if (dto.kind === 'patient') {
    return {
      kind: 'patient',
      patientId: dto.patient.id as PatientId,
      displayName: dto.patient.displayName,
      givenName: dto.patient.givenName,
      mrn: dto.patient.mrn,
      organizationId,
      organizationName: dto.organization.name,
      facilities: dto.facilities.map(toFacility),
      csrfToken: dto.csrfToken,
    }
  }
  return {
    kind: 'staff',
    staffId: dto.staff.id as StaffId,
    displayName: dto.staff.displayName,
    title: dto.staff.title,
    organizationId,
    organizationName: dto.organization.name,
    memberships: dto.memberships.map((m) => ({ ...m, facility: toFacility(m.facility) })),
    csrfToken: dto.csrfToken,
  }
}

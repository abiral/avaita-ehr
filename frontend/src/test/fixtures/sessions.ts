import type { PatientId, StaffId } from '@/core/branded'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { FacilitySummary, PatientSession, StaffSession } from '@/domain/identity'

export const ORG_ID = 'org_northvale' as OrganizationId
export const NVG = 'fac_nvg' as FacilityId
export const NVE = 'fac_nve' as FacilityId

export const nvg: FacilitySummary = {
  id: NVG,
  name: 'Northvale General Hospital',
  shortName: 'Northvale General',
  city: 'Kathmandu',
  timeZone: 'Asia/Kathmandu',
}
export const nve: FacilitySummary = {
  id: NVE,
  name: 'Northvale Eastside Clinic',
  shortName: 'Northvale Eastside',
  city: 'Bhaktapur',
  timeZone: 'Asia/Kathmandu',
}

export const patientSession: PatientSession = {
  kind: 'patient',
  patientId: 'pt_ramesh' as PatientId,
  displayName: 'Ramesh Pandey',
  givenName: 'Ramesh',
  mrn: 'NVG-188240',
  organizationId: ORG_ID,
  organizationName: 'Northvale Health',
  facilities: [nvg],
  csrfToken: 'mock-csrf-token',
}

export const staffSession: StaffSession = {
  kind: 'staff',
  staffId: 'st_anaya' as StaffId,
  displayName: 'Dr. Anaya Shrestha',
  title: 'Hospitalist',
  organizationId: ORG_ID,
  organizationName: 'Northvale Health',
  csrfToken: 'mock-csrf-token',
  memberships: [
    {
      facility: nvg,
      role: 'Hospitalist',
      departments: [{ id: 'dep_im4b', name: 'Internal Medicine', unit: '4B' }],
      permissions: [
        'chart:read',
        'note:write',
        'note:sign',
        'order:write',
        'result:review',
        'result:release',
        'refill:decide',
        'schedule:read',
        'schedule:book-for-patient',
        'org:admin',
      ],
    },
    {
      facility: nve,
      role: 'Physician',
      departments: [{ id: 'dep_nve_opd', name: 'Outpatient clinic', unit: 'OPD' }],
      permissions: ['chart:read'],
    },
  ],
}

export const adminSession: StaffSession = {
  ...staffSession,
  staffId: 'st_sarita' as StaffId,
  displayName: 'Sarita Joshi',
  title: 'Facility admin',
  memberships: [
    {
      facility: nvg,
      role: 'Facility admin',
      departments: [],
      permissions: ['schedule:read', 'schedule:admin', 'package:admin', 'org:admin', 'schedule:book-for-patient'],
    },
  ],
}

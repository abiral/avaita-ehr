import type { Permission } from '@/domain/identity'

/** Fictional sample data from the design files. Never real patients. */
export const ORG = { id: 'org_northvale', name: 'Northvale Health' }

export interface SeedFacility {
  readonly id: string
  readonly name: string
  readonly shortName: string
  readonly city: string
  readonly timeZone: string
  readonly kind: string
  readonly status: 'live' | 'onboarding'
}

export const FACILITIES: readonly SeedFacility[] = [
  {
    id: 'fac_nvg',
    name: 'Northvale General Hospital',
    shortName: 'Northvale General',
    city: 'Kathmandu',
    timeZone: 'Asia/Kathmandu',
    kind: 'Acute care · 312 beds',
    status: 'live',
  },
  {
    id: 'fac_nve',
    name: 'Northvale Eastside Clinic',
    shortName: 'Northvale Eastside',
    city: 'Bhaktapur',
    timeZone: 'Asia/Kathmandu',
    kind: 'Outpatient · 14 rooms',
    status: 'live',
  },
  {
    id: 'fac_lkv',
    name: 'Lakeview Hospital',
    shortName: 'Lakeview',
    city: 'Pokhara',
    timeZone: 'Asia/Kathmandu',
    kind: 'Joining the network',
    status: 'onboarding',
  },
]

const CLINICAL: Permission[] = [
  'chart:read',
  'note:write',
  'note:sign',
  'order:write',
  'result:review',
  'result:release',
  'refill:decide',
  'schedule:read',
  'schedule:book-for-patient',
]
const ADMIN: Permission[] = [
  'schedule:read',
  'schedule:admin',
  'package:admin',
  'org:admin',
  'schedule:book-for-patient',
]

export interface SeedMembership {
  readonly facilityId: string
  readonly role: string
  readonly departments: readonly { id: string; name: string; unit: string }[]
  readonly permissions: readonly Permission[]
  readonly note: string
}

export interface SeedStaff {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly title: string
  readonly memberships: readonly SeedMembership[]
}

export const STAFF: readonly SeedStaff[] = [
  {
    id: 'st_anaya',
    email: 'anaya.shrestha@northvale.health',
    displayName: 'Dr. Anaya Shrestha',
    title: 'Hospitalist',
    memberships: [
      {
        facilityId: 'fac_nvg',
        role: 'Hospitalist',
        note: 'Hospitalist · Ward 4B, 4C',
        departments: [
          { id: 'dep_im4b', name: 'Internal Medicine', unit: '4B' },
          { id: 'dep_im4c', name: 'Internal Medicine', unit: '4C' },
          { id: 'dep_ed', name: 'Emergency (cover)', unit: '' },
          { id: 'dep_opd', name: 'Outpatient clinic', unit: '' },
        ],
        permissions: [...CLINICAL, 'org:admin'],
      },
      {
        facilityId: 'fac_nve',
        role: 'Physician',
        note: 'Tuesday and Thursday clinics',
        departments: [{ id: 'dep_nve_opd', name: 'Outpatient clinic', unit: '' }],
        permissions: CLINICAL,
      },
    ],
  },
  {
    id: 'st_sarita',
    email: 'sarita.joshi@northvale.health',
    displayName: 'Sarita Joshi',
    title: 'Facility admin',
    memberships: [
      {
        facilityId: 'fac_nvg',
        role: 'Facility admin',
        note: 'Admin console',
        departments: [{ id: 'dep_admin', name: 'Administration', unit: '' }],
        permissions: ADMIN,
      },
    ],
  },
  {
    id: 'st_prakash',
    email: 'prakash.karki@northvale.health',
    displayName: 'Dr. Prakash Karki',
    title: 'Nephrologist',
    memberships: [
      {
        facilityId: 'fac_nvg',
        role: 'Consultant',
        note: 'Nephrology clinic',
        departments: [{ id: 'dep_neph', name: 'Nephrology', unit: '' }],
        permissions: CLINICAL,
      },
    ],
  },
]

export interface SeedPatientAccount {
  readonly patientId: string
  readonly email: string
  readonly phone: string
  readonly facilityIds: readonly string[]
}

export const PATIENT_ACCOUNTS: readonly SeedPatientAccount[] = [
  { patientId: 'pt_ramesh', email: 'ramesh.pandey@mail.com', phone: '9841234567', facilityIds: ['fac_nvg'] },
]

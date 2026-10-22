import { k } from './time'

export const FACILITY_STATS: Readonly<
  Record<string, { code: string; type: string; beds: number | null; staffCount: number; patientCount: number | null }>
> = {
  fac_nvg: { code: 'NVG', type: 'Acute care hospital', beds: 312, staffCount: 1240, patientCount: 86410 },
  fac_nve: { code: 'NVE', type: 'Outpatient clinic', beds: null, staffCount: 96, patientCount: 14902 },
  fac_lkv: { code: 'LKV', type: 'Acute care hospital', beds: 180, staffCount: 410, patientCount: null },
}

export const ONBOARDING = {
  facilityName: 'Lakeview Hospital',
  goLive: k('2026-12-01', '09:00'),
  steps: [
    {
      title: 'Facility profile and departments',
      detail: '14 departments, 9 wards',
      state: 'done' as const,
      progress: 'Done',
    },
    { title: 'Staff accounts and SSO', detail: '410 of 410 staff invited', state: 'done' as const, progress: 'Done' },
    {
      title: 'Patient record migration',
      detail: 'Matching against the shared patient index',
      state: 'in-progress' as const,
      progress: '62%',
    },
    {
      title: 'Lab and pharmacy interfaces',
      detail: 'HL7 feeds to Lakeview laboratory',
      state: 'next' as const,
      progress: 'Next',
    },
    {
      title: 'Training and go-live',
      detail: 'Super-user sessions from 20 Nov',
      state: 'planned' as const,
      progress: 'Planned',
    },
  ],
}

export const SETTINGS = [
  { name: 'Patient identity and medical record number', scope: 'organization' as const },
  { name: 'Drug formulary and interaction rules', scope: 'organization' as const },
  { name: 'Note templates and order sets', scope: 'organization-overridable' as const },
  { name: 'Lab test catalogue and reference ranges', scope: 'facility' as const },
  { name: 'Clinic schedules and rooms', scope: 'facility' as const },
  { name: 'Patient portal branding', scope: 'organization' as const },
  { name: 'Billing and price lists', scope: 'facility' as const },
]

export const ROLES = [
  {
    role: 'Physician',
    access: { NVG: 'Full chart, orders, prescribe', NVE: 'Full chart, orders, prescribe', LKV: 'After go-live' },
  },
  { role: 'Nurse', access: { NVG: 'Chart, vitals, administer', NVE: 'Chart, vitals', LKV: 'After go-live' } },
  { role: 'Lab technician', access: { NVG: 'Lab results entry', NVE: 'None', LKV: 'Lab results entry' } },
  {
    role: 'Front desk',
    access: { NVG: 'Registration, scheduling', NVE: 'Registration, scheduling', LKV: 'Registration' },
  },
  { role: 'Pharmacist', access: { NVG: 'Dispense, verify', NVE: 'Dispense', LKV: 'After go-live' } },
]

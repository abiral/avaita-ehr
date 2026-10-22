import type { LabResultId, PatientId, PractitionerId } from '@/core/branded'
import type { OrganizationId, TenantScope } from '@/core/tenant'
import type { VisitMode } from '@/domain/scheduling/types'

/** Every query key starts with the facility or organization scope (section 4). */
export const scopedKeys = (s: TenantScope) => {
  const f = ['f', s.facilityId] as const
  const o = ['o', s.organizationId] as const
  return {
    facility: f,
    organization: o,
    practitioners: (filter: { category?: string; q?: string; staffOnly?: boolean }) =>
      [...f, 'practitioners', filter] as const,
    allPractitioners: [...f, 'practitioners'] as const,
    practitioner: (id: PractitionerId) => [...f, 'practitioners', id] as const,
    availability: (id: PractitionerId) => [...f, 'availability', id] as const,
    timeOff: (range: { from: string; to: string }) => [...f, 'time-off', range] as const,
    allTimeOff: [...f, 'time-off'] as const,
    slots: (id: PractitionerId, mode: VisitMode, from: string) => [...f, 'slots', id, mode, from] as const,
    allSlots: [...f, 'slots'] as const,
    rules: [...f, 'booking-rules'] as const,
    appointments: { all: [...f, 'appointments'] as const, mine: [...f, 'appointments', 'mine'] as const },
    practitionerDay: (id: PractitionerId, day: string) => [...f, 'appointments', 'practitioner', id, day] as const,
    packages: [...f, 'packages'] as const,
    patients: [...f, 'patients'] as const,
    patientSearch: (q: string) => [...f, 'patients', 'search', q] as const,
    today: [...f, 'today'] as const,
    patientSummary: (id: PatientId) => [...o, 'patients', id, 'summary'] as const,
    notes: (id: PatientId) => [...o, 'patients', id, 'notes'] as const,
    patientResults: (id: PatientId) => [...f, 'results', 'patient', id] as const,
    recentCollections: (id: PatientId) => [...f, 'results', 'recent', id] as const,
    labCatalogue: [...f, 'lab-catalogue'] as const,
    labBasket: (id: PatientId) => [...f, 'lab-basket', id] as const,
    resultsInbox: [...f, 'results', 'inbox'] as const,
    allResults: [...f, 'results'] as const,
    result: (id: LabResultId) => [...f, 'results', id] as const,
    myReports: [...f, 'reports', 'mine'] as const,
    myMedications: [...f, 'medications', 'mine'] as const,
    medicationRequests: [...f, 'medication-requests'] as const,
    organizationOverview: [...o, 'overview'] as const,
  }
}
export type ScopedKeys = ReturnType<typeof scopedKeys>

/** Organization-level keys for data read before a facility is chosen (C1). */
export const organizationKeys = (organizationId: OrganizationId) => {
  const o = ['o', organizationId] as const
  return { myFacilities: [...o, 'me', 'facilities'] as const }
}

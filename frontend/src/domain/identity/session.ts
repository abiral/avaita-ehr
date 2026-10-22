import type { PatientId, StaffId } from '@/core/branded'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { Permission } from './permissions'

export type AccountKind = 'patient' | 'staff'

export interface Department {
  readonly id: string
  readonly name: string
  readonly unit: string
}

export interface FacilitySummary {
  readonly id: FacilityId
  readonly name: string
  readonly shortName: string
  readonly city: string
  readonly timeZone: string
}

export interface StaffMembership {
  readonly facility: FacilitySummary
  readonly role: string
  readonly departments: readonly Department[]
  readonly permissions: readonly Permission[]
}

export interface PatientSession {
  readonly kind: 'patient'
  readonly patientId: PatientId
  readonly displayName: string
  readonly givenName: string
  readonly mrn: string
  readonly organizationId: OrganizationId
  readonly organizationName: string
  readonly facilities: readonly FacilitySummary[]
  readonly csrfToken: string
}

export interface StaffSession {
  readonly kind: 'staff'
  readonly staffId: StaffId
  readonly displayName: string
  readonly title: string
  readonly organizationId: OrganizationId
  readonly organizationName: string
  readonly memberships: readonly StaffMembership[]
  readonly csrfToken: string
}

export type Session = PatientSession | StaffSession

export const initials = (name: string): string =>
  name
    .replace(/^Dr\.\s+/, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .filter((_, i, all) => i === 0 || i === all.length - 1)
    .join('')
    .toUpperCase()

export const membershipFor = (session: StaffSession, facilityId: FacilityId): StaffMembership | undefined =>
  session.memberships.find((m) => m.facility.id === facilityId)

export const can = (session: StaffSession, facilityId: FacilityId, permission: Permission): boolean =>
  membershipFor(session, facilityId)?.permissions.includes(permission) ?? false

/** Staff land on facility selection unless they hold exactly one membership. */
export const needsFacilityChoice = (session: StaffSession): boolean => session.memberships.length !== 1

/** Idle lock after this many minutes (ADR 0006). */
export const IDLE_LIMIT_MINUTES: Readonly<Record<AccountKind, number>> = { staff: 10, patient: 15 }
export const LOCKED_LIMIT_MINUTES = 30

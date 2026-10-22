import type { FacilityId } from '@/core/tenant'

export interface FacilityDetail {
  readonly id: FacilityId
  readonly name: string
  readonly code: string
  readonly type: string
  readonly kind: string
  readonly beds: number | null
  readonly staffCount: number
  readonly patientCount: number | null
  readonly status: 'live' | 'onboarding'
  /** The current user's note for C1, for example "Hospitalist · Ward 4B, 4C". */
  readonly membershipNote: string | null
}

export interface OnboardingStep {
  readonly title: string
  readonly detail: string
  readonly state: 'done' | 'in-progress' | 'next' | 'planned'
  readonly progress: string
}

export interface SettingScope {
  readonly name: string
  readonly scope: 'organization' | 'organization-overridable' | 'facility'
}

export interface RoleAccess {
  readonly role: string
  readonly access: Readonly<Record<string, string>>
}

export interface OrganizationOverview {
  readonly facilities: readonly FacilityDetail[]
  readonly onboarding: { readonly facilityName: string; readonly steps: readonly OnboardingStep[] } | null
  readonly settings: readonly SettingScope[]
  readonly roles: readonly RoleAccess[]
}

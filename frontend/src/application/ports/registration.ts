import type { RegistrationId } from '@/core/branded'

export interface RegistrationInput {
  readonly givenName: string
  readonly familyName: string
  readonly birthDate: string
  readonly sex: 'male' | 'female' | 'other' | 'undisclosed'
  readonly mobile: string
  readonly email: string
  readonly password: string
  readonly hospitalNumber: string
  readonly acceptedTerms: boolean
}

export interface Registration {
  readonly id: RegistrationId
  readonly maskedMobile: string
}

export interface VerifiedRegistration {
  readonly mrn: string
  readonly facilityName: string | null
  readonly linked: { readonly visits: number; readonly labReports: number; readonly medicines: number }
}

export interface RegistrationRepository {
  register(input: RegistrationInput): Promise<Registration>
  verify(id: RegistrationId, code: string): Promise<VerifiedRegistration>
  resend(id: RegistrationId): Promise<void>
}

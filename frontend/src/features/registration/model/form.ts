import type { RegistrationInput } from '@/application/ports'

export interface DetailsForm {
  readonly givenName: string
  readonly familyName: string
  readonly birthDate: string
  readonly sex: RegistrationInput['sex']
  readonly mobile: string
  readonly email: string
  readonly password: string
  readonly hospitalNumber: string
  readonly acceptedTerms: boolean
}

export const EMPTY_DETAILS: DetailsForm = {
  givenName: '',
  familyName: '',
  birthDate: '',
  sex: 'male',
  mobile: '',
  email: '',
  password: '',
  hospitalNumber: '',
  acceptedTerms: false,
}

export const RESEND_SECONDS = 45
export const CODE_LENGTH = 6

/** Seconds left before "Resend code" is allowed, from the time the code was sent. */
export const resendLeft = (sentAt: Date, now: Date): number =>
  Math.max(0, RESEND_SECONDS - Math.floor((now.getTime() - sentAt.getTime()) / 1000))

export const formatCountdown = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

import { assertNever } from '@/core/assertNever'
import type { PackageId } from '@/core/branded'
import { packageFormats } from './formats'
import type { ConsultationPackage, PackageFormat } from './types'

/**
 * P6 flow: browse -> detail -> format -> first-visit -> submitting -> booked | failed.
 * The design shows detail, format and first visit on one page; the steps still gate what can happen.
 */
export type PackageBookingStep = 'browse' | 'detail' | 'format' | 'first-visit' | 'submitting' | 'booked' | 'failed'

export interface PackageBookingState {
  readonly step: PackageBookingStep
  readonly packageId: PackageId | null
  readonly format: PackageFormat | null
  readonly start: Date | null
  readonly enrollmentId: string | null
  readonly error: string | null
}

export type PackageBookingEvent =
  | { readonly type: 'open'; readonly pkg: Pick<ConsultationPackage, 'id' | 'format'> }
  | { readonly type: 'close' }
  | { readonly type: 'pick-format'; readonly format: PackageFormat }
  | { readonly type: 'pick-slot'; readonly start: Date }
  | { readonly type: 'submit' }
  | { readonly type: 'booked'; readonly enrollmentId: string }
  | { readonly type: 'failed'; readonly error: string }

export const initialPackageBooking: PackageBookingState = {
  step: 'browse',
  packageId: null,
  format: null,
  start: null,
  enrollmentId: null,
  error: null,
}

const CHOOSING: readonly PackageBookingStep[] = ['detail', 'format', 'first-visit', 'failed']

/** Opening a package preselects its first format choice (patient_choice starts on-site). */
const open = (pkg: Pick<ConsultationPackage, 'id' | 'format'>): PackageBookingState => ({
  ...initialPackageBooking,
  step: 'detail',
  packageId: pkg.id,
  format: packageFormats[pkg.format].choices[0] ?? null,
})

const pickFormat = (s: PackageBookingState, format: PackageFormat): PackageBookingState =>
  CHOOSING.includes(s.step) ? { ...s, step: 'format', format, start: null, error: null } : s
const pickSlot = (s: PackageBookingState, start: Date): PackageBookingState =>
  CHOOSING.includes(s.step) && s.format ? { ...s, step: 'first-visit', start, error: null } : s
const submit = (s: PackageBookingState): PackageBookingState =>
  s.step === 'first-visit' && s.start ? { ...s, step: 'submitting', error: null } : s
const booked = (s: PackageBookingState, enrollmentId: string): PackageBookingState =>
  s.step === 'submitting' ? { ...s, step: 'booked', enrollmentId } : s
const failed = (s: PackageBookingState, error: string): PackageBookingState =>
  s.step === 'submitting' ? { ...s, step: 'failed', start: null, error } : s

export function packageBookingFlow(s: PackageBookingState, e: PackageBookingEvent): PackageBookingState {
  switch (e.type) {
    case 'open':
      return open(e.pkg)
    case 'close':
      return s.step === 'submitting' ? s : initialPackageBooking
    case 'pick-format':
      return pickFormat(s, e.format)
    case 'pick-slot':
      return pickSlot(s, e.start)
    case 'submit':
      return submit(s)
    case 'booked':
      return booked(s, e.enrollmentId)
    case 'failed':
      return failed(s, e.error)
    default:
      return assertNever(e)
  }
}

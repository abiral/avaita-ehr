import type { AppointmentId, PatientId, PractitionerId } from '@/core/branded'
import type { VisitMode } from '../scheduling/types'

export const APPOINTMENT_STATUSES = ['booked', 'arrived', 'completed', 'cancelled', 'no_show'] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export const APPOINTMENT_KINDS = ['consultation', 'lab'] as const
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number]

export const CANCEL_REASONS = ['feeling-better', 'time-no-longer-works', 'another-doctor', 'other'] as const
export type CancelReason = (typeof CANCEL_REASONS)[number]

export const CANCELLED_BY = ['patient', 'staff'] as const
export type CancelledBy = (typeof CANCELLED_BY)[number]

export interface Appointment {
  readonly id: AppointmentId
  readonly patientId: PatientId
  readonly patientName: string
  readonly practitionerId: PractitionerId | null
  readonly practitionerName: string
  readonly kind: AppointmentKind
  readonly title: string
  readonly reason: string
  readonly start: Date
  readonly end: Date
  readonly mode: VisitMode
  readonly status: AppointmentStatus
  readonly location: string
  readonly preparation: string
  readonly cancelReason: CancelReason | null
  readonly cancelledBy: CancelledBy | null
  readonly packageEnrollmentId: string | null
  readonly hasSummary: boolean
}

export interface NewAppointment {
  readonly patientId: PatientId | null
  readonly practitionerId: PractitionerId
  readonly start: Date
  readonly mode: VisitMode
  readonly reason: string
  /** Staff bookings: text the patient a confirmation. */
  readonly notifyBySms?: boolean
}

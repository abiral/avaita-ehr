import type { MedicationId, MedicationRequestId, PatientId } from '@/core/branded'

export interface Medication {
  readonly id: MedicationId
  readonly name: string
  readonly instructions: string
  readonly indication: string
  readonly prescriber: string
  readonly daysLeft: number
  readonly supplyDays: number
  readonly status: 'active' | 'ended'
  readonly endedAt: Date | null
  readonly openRequest: {
    readonly id: MedicationRequestId
    readonly requestedAt: Date
    readonly status: RefillStatus
  } | null
}

export const REFILL_STATUSES = [
  'requested',
  'under-review',
  'approved',
  'changed',
  'declined',
  'ready-for-pickup',
  'delivered',
] as const
export type RefillStatus = (typeof REFILL_STATUSES)[number]

export const PICKUPS = ['hospital-pharmacy', 'home-delivery'] as const
export type Pickup = (typeof PICKUPS)[number]

export const DECISIONS = ['approve', 'change', 'decline'] as const
export type DecisionKind = (typeof DECISIONS)[number]

export interface RefillRequest {
  readonly id: MedicationRequestId
  readonly patientId: PatientId
  readonly patientName: string
  readonly patientSex: 'male' | 'female' | 'other'
  readonly patientBirthDate: string
  readonly mrn: string
  readonly medicationName: string
  readonly instructions: string
  readonly indication: string
  readonly lastDispensed: { readonly at: Date; readonly quantity: number } | null
  readonly quantityDays: number
  readonly pickup: Pickup
  readonly note: string
  readonly allergies: readonly string[]
  readonly requestedAt: Date
  readonly status: RefillStatus
  readonly decidedBy: string | null
  readonly decidedAt: Date | null
  /** Latest relevant labs for safety checks. */
  readonly labs: readonly { readonly code: string; readonly value: number; readonly at: Date }[]
  readonly drugClass: string
}

export interface NewRefillRequest {
  readonly medicationId: MedicationId
  readonly quantityDays: number
  readonly pickup: Pickup
  readonly note: string
}

export type RefillDecision =
  | {
      readonly kind: 'approve'
      readonly quantity: number
      readonly repeats: number
      readonly sendTo: Pickup
      readonly message: string
      readonly acknowledgedChecks: readonly string[]
    }
  | { readonly kind: 'change'; readonly newDose: string; readonly labFollowUp: string; readonly message: string }
  | { readonly kind: 'decline'; readonly reason: string; readonly message: string }

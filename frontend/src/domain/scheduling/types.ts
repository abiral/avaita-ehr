import type { BlockId, PractitionerId, TimeOffId } from '@/core/branded'

export const VISIT_MODES = ['onsite', 'remote'] as const
export type VisitMode = (typeof VISIT_MODES)[number]

export const BLOCK_MODES = ['onsite', 'remote', 'both'] as const
export type BlockMode = (typeof BLOCK_MODES)[number]

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** Wall-clock time in the facility zone, "HH:mm". */
export type LocalTime = string
/** Calendar date in the facility zone, "yyyy-MM-dd". */
export type LocalDate = string

export const REPEAT_RULES = ['weekly', 'biweekly', 'once'] as const
export type RepeatRule = (typeof REPEAT_RULES)[number]

export interface Practitioner {
  readonly id: PractitionerId
  readonly displayName: string
  readonly category: string
  readonly qualifications: string
  readonly languages: readonly string[]
  readonly keywords: readonly string[]
  readonly offersOnsite: boolean
  readonly offersRemote: boolean
  readonly location: string
  readonly nextAvailableAt: Date | null
}

export interface AvailabilityBlock {
  readonly id: BlockId
  readonly practitionerId: PractitionerId
  readonly weekday: Weekday
  readonly start: LocalTime
  readonly end: LocalTime
  readonly slotMinutes: number
  readonly mode: BlockMode
  readonly room: string | null
  readonly repeat: RepeatRule
  readonly effectiveFrom: LocalDate
}

export type NewAvailabilityBlock = Omit<AvailabilityBlock, 'id' | 'practitionerId'>

export const TIME_OFF_KINDS = ['full', 'part', 'recurring'] as const
export type TimeOffKind = (typeof TIME_OFF_KINDS)[number]

export const TIME_OFF_REASONS = ['personal', 'annual', 'sick', 'conference', 'duty', 'meeting', 'other'] as const
export type TimeOffReason = (typeof TIME_OFF_REASONS)[number]

export const HANDLINGS = ['notify', 'reassign', 'keep'] as const
export type Handling = (typeof HANDLINGS)[number]

export interface TimeOff {
  readonly id: TimeOffId
  readonly practitionerId: PractitionerId
  readonly practitionerName: string
  readonly kind: TimeOffKind
  readonly start: Date
  readonly end: Date
  readonly reason: TimeOffReason
  readonly patientNote: string
  readonly handling: Handling
  readonly coverPractitionerId: PractitionerId | null
  readonly affectedCount: number
  readonly impactNote: string
}

export interface NewTimeOff {
  readonly practitionerId: PractitionerId
  readonly kind: TimeOffKind
  readonly start: Date
  readonly end: Date
  readonly reason: TimeOffReason
  readonly patientNote: string
  readonly handling: Handling
  readonly coverPractitionerId: PractitionerId | null
}

export interface TimeOffImpact {
  readonly affected: readonly { readonly appointmentId: string; readonly patientName: string; readonly start: Date }[]
  readonly removedSlots: number
}

export interface BookingRules {
  readonly maxDaysAhead: number
  readonly minNoticeMinutes: number
  readonly cancelCutoffMinutes: number
  readonly bufferMinutes: number
}

export interface Slot {
  readonly start: Date
  readonly end: Date
  readonly mode: VisitMode
  readonly available: boolean
}

export interface DateRange {
  readonly from: Date
  readonly to: Date
}

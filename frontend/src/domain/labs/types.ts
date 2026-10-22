import type { LabOrderId, LabResultId, PatientId } from '@/core/branded'

export const LAB_FLAGS = ['normal', 'high', 'low', 'critical-high', 'critical-low'] as const
export type LabFlag = (typeof LAB_FLAGS)[number]

export interface ReferenceRange {
  /** Null when only an upper bound applies ("Below 5.2"). */
  readonly low: number | null
  /** Null when only a lower bound applies ("Above 60"). */
  readonly high: number | null
  readonly criticalLow: number | null
  readonly criticalHigh: number | null
}

export interface Analyte {
  readonly code: string
  readonly name: string
  readonly value: number
  readonly unit: string
  readonly range: ReferenceRange
  /** Previous values, oldest first, with their collection dates. */
  readonly history: readonly { readonly at: Date; readonly value: number }[]
}

export const REVIEW_STATUSES = ['unreviewed', 'acknowledged'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export interface LabResult {
  readonly id: LabResultId
  readonly patientId: PatientId
  readonly patientName: string
  readonly mrn: string
  readonly panel: string
  readonly accession: string
  readonly collectedAt: Date
  readonly reportedAt: Date
  readonly orderedBy: string
  readonly analytes: readonly Analyte[]
  readonly preliminary: boolean
  readonly review: ReviewStatus
  readonly acknowledgedBy: string | null
  readonly acknowledgedAt: Date | null
  readonly releasedToPatient: boolean
  readonly patientComment: string
}

export interface InboxItem {
  readonly id: LabResultId
  readonly patientName: string
  readonly panel: string
  readonly reportedAt: Date
  readonly worstFlag: LabFlag
  readonly preliminary: boolean
  readonly review: ReviewStatus
}

/** Patient portal view: released reports only. */
export interface PatientReport {
  readonly id: LabResultId
  readonly panel: string
  readonly collectedAt: Date
  readonly orderedBy: string
  readonly reviewedBy: string | null
  readonly isNew: boolean
  readonly comment: string
  readonly analytes: readonly Omit<Analyte, 'history'>[]
}

export const LAB_CATEGORIES = ['chemistry', 'haematology', 'microbiology', 'imaging', 'cardiology'] as const
export type LabCategory = (typeof LAB_CATEGORIES)[number]

export interface LabTest {
  readonly code: string
  readonly name: string
  readonly category: LabCategory
  readonly specimen: string
  readonly turnaround: string
}

export interface OrderSet {
  readonly id: string
  readonly name: string
  readonly testCodes: readonly string[]
}

export const PRIORITIES = ['urgent', 'routine', 'stat'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface NewLabOrder {
  readonly patientId: PatientId
  readonly items: readonly { readonly testCode: string; readonly priority: Priority; readonly collect: string }[]
  readonly indication: string
}

export interface LabOrder {
  readonly id: LabOrderId
  readonly patientId: PatientId
  readonly placedAt: Date
  readonly itemCount: number
}

/** A test already collected recently for this patient (duplicate warning). */
export interface RecentCollection {
  readonly testCode: string
  readonly collectedAt: Date
}

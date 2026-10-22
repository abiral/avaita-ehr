import type { NoteId, PatientId } from '@/core/branded'

export const SEXES = ['male', 'female', 'other'] as const
export type Sex = (typeof SEXES)[number]

export const PATIENT_FLAGS = ['penicillin', 'isolation', 'falls', 'dnacpr', 'nkda'] as const
export type PatientFlag = (typeof PATIENT_FLAGS)[number]

export interface Allergy {
  readonly substance: string
  readonly reaction: string
}

/** Two identifiers (name and MRN) are always shown before any write to the record. */
export interface PatientBanner {
  readonly id: PatientId
  readonly displayName: string
  readonly sex: Sex
  readonly birthDate: string
  readonly mrn: string
  readonly bed: string | null
  readonly ward: string | null
  readonly admittedAt: Date | null
  readonly attendingName: string | null
  readonly allergies: readonly Allergy[]
  readonly codeStatus: string
}

export interface PatientListItem {
  readonly id: PatientId
  readonly displayName: string
  readonly sex: Sex
  readonly birthDate: string
  readonly mrn: string
  readonly bed: string | null
  readonly attendingName: string | null
  readonly mine: boolean
  readonly admittedAt: Date | null
  readonly diagnosis: string
  readonly flags: readonly PatientFlag[]
  readonly next: string
  readonly nextTone: 'neutral' | 'info' | 'alert'
  readonly seenAt: Date | null
}

export const PROBLEM_STATUSES = ['active', 'new', 'chronic', 'resolved'] as const
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number]

export interface Problem {
  readonly name: string
  readonly detail: string
  readonly status: ProblemStatus
}

export interface VitalSeries {
  readonly key: 'temperature' | 'heartRate' | 'bloodPressure' | 'respiratoryRate' | 'spo2'
  readonly display: string
  readonly unit: string
  readonly trend: readonly number[]
  readonly note: string
}

export interface CareTeamMember {
  readonly name: string
  readonly role: string
}

export interface ActiveMedication {
  readonly name: string
  readonly detail: string
}

export interface NoteSummary {
  readonly id: NoteId
  readonly title: string
  readonly authorName: string
  readonly at: Date
  readonly status: NoteStatus
}

export interface PatientSummary {
  readonly banner: PatientBanner
  readonly alert: {
    readonly analyte: string
    readonly value: string
    readonly range: string
    readonly at: Date
    readonly resultId: string
  } | null
  readonly vitals: readonly VitalSeries[]
  readonly vitalsTakenAt: Date | null
  readonly vitalsTakenBy: string
  readonly problems: readonly Problem[]
  readonly medications: readonly ActiveMedication[]
  readonly careTeam: readonly CareTeamMember[]
  readonly notes: readonly NoteSummary[]
}

export const NOTE_STATUSES = ['draft', 'signed'] as const
export type NoteStatus = (typeof NOTE_STATUSES)[number]

export const NOTE_SECTION_KEYS = ['reason', 'history', 'examination', 'assessment', 'followUp'] as const
export type NoteSectionKey = (typeof NOTE_SECTION_KEYS)[number]

export interface PlanItem {
  readonly text: string
  readonly orderStatus: 'none' | 'ordered' | 'lab-ordered'
}

export interface ClinicalNote {
  readonly id: NoteId
  readonly patientId: PatientId
  readonly template: string
  readonly title: string
  readonly department: string
  readonly status: NoteStatus
  readonly sections: Readonly<Record<NoteSectionKey, string>>
  readonly plan: readonly PlanItem[]
  readonly authorName: string
  readonly createdAt: Date
  readonly savedAt: Date | null
  readonly signedAt: Date | null
  readonly copyTo: readonly CareTeamMember[]
  readonly addenda: readonly { readonly text: string; readonly at: Date; readonly authorName: string }[]
}

export interface NoteDraft {
  readonly template: string
  readonly sections: Readonly<Record<NoteSectionKey, string>>
  readonly plan: readonly PlanItem[]
}

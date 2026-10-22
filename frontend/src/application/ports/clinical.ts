import type { NoteId, PatientId } from '@/core/branded'
import type { ClinicalNote, NoteDraft, PatientListItem, PatientSummary } from '@/domain/clinical/types'

export interface StaffToday {
  readonly attention: readonly {
    readonly kind: 'critical-result' | 'cosign' | 'medication'
    readonly title: string
    readonly patientName: string
    readonly context: string
    readonly target: { readonly type: 'result' | 'note' | 'chart'; readonly id: string; readonly patientId: string }
  }[]
  readonly agenda: readonly { readonly at: Date; readonly what: string }[]
  readonly notesToSign: number
  readonly plannedDischarges: number
}

export interface ClinicalRepository {
  patients(signal?: AbortSignal): Promise<PatientListItem[]>
  summary(id: PatientId, signal?: AbortSignal): Promise<PatientSummary>
  today(signal?: AbortSignal): Promise<StaffToday>
  notes(id: PatientId, signal?: AbortSignal): Promise<ClinicalNote[]>
  saveNote(id: PatientId, draft: NoteDraft, noteId: NoteId | null): Promise<ClinicalNote>
  signNote(noteId: NoteId): Promise<ClinicalNote>
  addAddendum(noteId: NoteId, text: string): Promise<ClinicalNote>
}

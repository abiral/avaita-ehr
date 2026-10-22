import type { NoteId, PatientId } from '@/core/branded'
import { AppError } from '@/core/errors'
import { noteStatus, signProblems, type ClinicalNote, type NoteDraft, type NoteStatus } from '@/domain/clinical'
import { labResultReview, type LabOrder, type LabResult, type NewLabOrder } from '@/domain/labs'
import type { ClinicalRepository, LabRepository } from '../ports'
import { outcome, type Outcome } from './outcome'

const refuse = (code: 'conflict' | 'validation_failed', message: string): never => {
  throw new AppError(message, code)
}

/** Creates the note on first save, then updates the draft. Signed notes only take addenda. */
export const saveNoteDraft =
  (deps: { clinical: Pick<ClinicalRepository, 'saveNote'> }) =>
  async (input: {
    patientId: PatientId
    noteId: NoteId | null
    status: NoteStatus
    draft: NoteDraft
  }): Promise<Outcome<ClinicalNote>> => {
    if (!noteStatus(input.status, 'save').ok) refuse('conflict', 'Signed notes take addenda only')
    return outcome(await deps.clinical.saveNote(input.patientId, input.draft, input.noteId))
  }

/** Saves the latest text, then signs. Refuses before any call when the note cannot be signed. */
export const signNote =
  (deps: { clinical: Pick<ClinicalRepository, 'saveNote' | 'signNote'> }) =>
  async (input: {
    patientId: PatientId
    noteId: NoteId | null
    status: NoteStatus
    draft: NoteDraft
  }): Promise<Outcome<ClinicalNote>> => {
    if (!noteStatus(input.status, 'sign').ok) refuse('conflict', 'Already signed')
    if (signProblems(input.draft).length > 0) refuse('validation_failed', 'Reason and assessment are required')
    const saved = await deps.clinical.saveNote(input.patientId, input.draft, input.noteId)
    return outcome(await deps.clinical.signNote(saved.id))
  }

export const addAddendum =
  (deps: { clinical: Pick<ClinicalRepository, 'addAddendum'> }) =>
  async (input: { note: Pick<ClinicalNote, 'id' | 'status'>; text: string }): Promise<Outcome<ClinicalNote>> => {
    if (!noteStatus(input.note.status, 'addend').ok) refuse('conflict', 'Only signed notes take addenda')
    if (!input.text.trim()) refuse('validation_failed', 'Addendum text is required')
    return outcome(await deps.clinical.addAddendum(input.note.id, input.text.trim()))
  }

export const placeLabOrder =
  (deps: { labs: Pick<LabRepository, 'placeOrder'> }) =>
  async (input: NewLabOrder): Promise<Outcome<LabOrder>> => {
    if (input.items.length === 0 || !input.indication.trim())
      refuse('validation_failed', 'Tests and an indication are required')
    return outcome(await deps.labs.placeOrder({ ...input, indication: input.indication.trim() }))
  }

/** Acknowledges, then releases with the comment when asked. A failed release is a warning, not a failure. */
export const acknowledgeResult =
  (deps: { labs: Pick<LabRepository, 'acknowledge' | 'release'> }) =>
  async (input: { result: LabResult; release: boolean; comment: string }): Promise<Outcome<LabResult>> => {
    if (!labResultReview(input.result, 'acknowledge').ok) refuse('conflict', 'Already acknowledged')
    const acknowledged = await deps.labs.acknowledge(input.result.id)
    if (!input.release) return outcome(acknowledged)
    try {
      return outcome(await deps.labs.release(input.result.id, input.comment.trim()))
    } catch {
      return outcome(acknowledged, [
        { code: 'release-failed', reason: 'Acknowledged, but not released to the patient' },
      ])
    }
  }

export const releaseResult =
  (deps: { labs: Pick<LabRepository, 'release'> }) =>
  async (input: { result: LabResult; comment: string }): Promise<Outcome<LabResult>> => {
    const check = labResultReview(input.result, 'release')
    if (!check.ok) refuse('conflict', check.error)
    return outcome(await deps.labs.release(input.result.id, input.comment.trim()))
  }

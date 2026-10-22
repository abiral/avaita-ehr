import { assertNever } from '@/core/assertNever'
import { err, ok, type Result } from '@/core/result'
import type { NoteDraft, NoteStatus } from './types'

/** C6: draft -> signed, then addenda only. */
export type NoteEvent = 'edit' | 'save' | 'sign' | 'addend'
export type NoteRefusal = 'signed-note-is-final' | 'draft-has-no-addenda'

export function noteStatus(status: NoteStatus, event: NoteEvent): Result<NoteStatus, NoteRefusal> {
  switch (event) {
    case 'edit':
    case 'save':
      return status === 'draft' ? ok('draft') : err('signed-note-is-final')
    case 'sign':
      return status === 'draft' ? ok('signed') : err('signed-note-is-final')
    case 'addend':
      return status === 'signed' ? ok('signed') : err('draft-has-no-addenda')
    default:
      return assertNever(event)
  }
}

export type SignProblem = 'reason-required' | 'assessment-required'

/** A note can be signed once it says why the patient was seen and what the clinician thinks. */
export function signProblems(draft: NoteDraft): SignProblem[] {
  const problems: SignProblem[] = []
  if (!draft.sections.reason.trim()) problems.push('reason-required')
  if (!draft.sections.assessment.trim()) problems.push('assessment-required')
  return problems
}

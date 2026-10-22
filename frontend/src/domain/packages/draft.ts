import type { PackageDraft } from './types'

export type DraftProblem = 'name-required' | 'doctor-required' | 'items-required' | 'cap-invalid'

/** What stops a package draft from being saved; publishing has the same rules. */
export function draftProblems(draft: PackageDraft): DraftProblem[] {
  const problems: DraftProblem[] = []
  if (!draft.name.trim()) problems.push('name-required')
  if (!draft.practitionerId) problems.push('doctor-required')
  if (draft.items.length === 0) problems.push('items-required')
  if (draft.monthlyCap !== null && (!Number.isInteger(draft.monthlyCap) || draft.monthlyCap < 1))
    problems.push('cap-invalid')
  return problems
}

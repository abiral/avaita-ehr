import type { DecisionKind, Pickup, RefillDecision, RefillRequest } from '@/domain/medications'
import { t } from '@/i18n'

export const QUANTITIES = [30, 60, 90] as const
export const REPEATS = [0, 1, 2] as const
export const LAB_OPTIONS = ['potassium', 'renal', 'none'] as const
export const DECLINE_REASONS = ['review', 'stopped', 'duplicate'] as const

export interface DecisionForm {
  readonly kind: DecisionKind
  readonly quantity: (typeof QUANTITIES)[number]
  readonly repeats: (typeof REPEATS)[number]
  readonly sendTo: Pickup
  readonly newDose: string
  readonly labFollowUp: (typeof LAB_OPTIONS)[number]
  readonly declineReason: (typeof DECLINE_REASONS)[number]
  readonly message: string
}

export const initialDecision = (r: RefillRequest): DecisionForm => ({
  kind: 'approve',
  quantity: QUANTITIES.find((q) => q === r.quantityDays) ?? 30,
  repeats: 0,
  sendTo: r.pickup,
  newDose: '',
  labFollowUp: 'potassium',
  declineReason: 'review',
  message: '',
})

/** The decision sent to the server; approval carries the ids of the checks the clinician confirmed. */
export function toDecision(f: DecisionForm, acknowledgedChecks: readonly string[]): RefillDecision {
  if (f.kind === 'approve')
    return {
      kind: 'approve',
      quantity: f.quantity,
      repeats: f.repeats,
      sendTo: f.sendTo,
      message: f.message.trim(),
      acknowledgedChecks,
    }
  if (f.kind === 'change')
    return {
      kind: 'change',
      newDose: f.newDose.trim(),
      labFollowUp: t(`clinical.refills.labOptions.${f.labFollowUp}`),
      message: f.message.trim(),
    }
  return { kind: 'decline', reason: t(`clinical.refills.declineReasons.${f.declineReason}`), message: f.message.trim() }
}

export const formProblem = (f: DecisionForm): 'new-dose-required' | null =>
  f.kind === 'change' && !f.newDose.trim() ? 'new-dose-required' : null

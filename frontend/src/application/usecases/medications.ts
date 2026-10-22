import { AppError } from '@/core/errors'
import {
  firedChecks,
  refillRequest as refillMachine,
  unacknowledged,
  type Medication,
  type NewRefillRequest,
  type RefillDecision,
  type RefillRequest,
} from '@/domain/medications'
import type { MedicationRepository } from '../ports'
import { outcome, type Outcome } from './outcome'

export const REFILL_QUANTITIES = [30, 60, 90] as const

/** P9: one open request per medicine, for an active medicine, in 30, 60 or 90 days. */
export const requestRefill =
  (deps: { medications: Pick<MedicationRepository, 'requestRefill'> }) =>
  async (input: NewRefillRequest & { medication: Medication }): Promise<Outcome<Medication>> => {
    const { medication, ...request } = input
    const open = medication.openRequest && ['requested', 'under-review'].includes(medication.openRequest.status)
    if (medication.status !== 'active' || open) throw new AppError('Refill not allowed', 'refill_not_allowed')
    if (!REFILL_QUANTITIES.some((q) => q === request.quantityDays))
      throw new AppError('Invalid quantity', 'validation_failed')
    return outcome(await deps.medications.requestRefill(request))
  }

/** C9: decisions only on open requests; approving needs every fired safety check acknowledged. */
export const decideRefill =
  (deps: { medications: Pick<MedicationRepository, 'decide'>; clock: { now(): Date } }) =>
  async (input: { request: RefillRequest; decision: RefillDecision }): Promise<Outcome<RefillRequest>> => {
    const { request, decision } = input
    if (!refillMachine(request.status, { type: 'decide', decision: decision.kind }).ok)
      throw new AppError('Already decided', 'conflict')
    if (decision.kind === 'approve') {
      const missing = unacknowledged(firedChecks(request, deps.clock.now()), decision.acknowledgedChecks)
      if (missing.length > 0) throw new AppError('Confirm the safety checks before approving', 'refill_not_allowed')
    }
    return outcome(await deps.medications.decide(request.id, decision))
  }

import { err, ok, type Result } from '@/core/result'
import type { DecisionKind, Pickup, RefillStatus } from './types'

/**
 * P9 and C9: requested -> under-review -> approved | changed | declined -> ready-for-pickup | delivered.
 * A decision can be made straight from requested (opening the request starts the review).
 */
export type RefillEvent =
  | { readonly type: 'review' }
  | { readonly type: 'decide'; readonly decision: DecisionKind }
  | { readonly type: 'dispense'; readonly pickup: Pickup }

const DECIDED: Readonly<Record<DecisionKind, RefillStatus>> = {
  approve: 'approved',
  change: 'changed',
  decline: 'declined',
}

const OPEN: readonly RefillStatus[] = ['requested', 'under-review']
const PRESCRIBED: readonly RefillStatus[] = ['approved', 'changed']

export function refillRequest(status: RefillStatus, event: RefillEvent): Result<RefillStatus, 'not-allowed'> {
  if (event.type === 'review') return status === 'requested' ? ok('under-review') : err('not-allowed')
  if (event.type === 'decide') return OPEN.includes(status) ? ok(DECIDED[event.decision]) : err('not-allowed')
  if (!PRESCRIBED.includes(status)) return err('not-allowed')
  return ok(event.pickup === 'home-delivery' ? 'delivered' : 'ready-for-pickup')
}

export const isOpenRefill = (status: RefillStatus): boolean => OPEN.includes(status)

/** Where the patient's progress bar is: 1 requested, 2 doctor reviewing, 3 decided or ready. */
export const refillStep = (status: RefillStatus): 1 | 2 | 3 => {
  if (status === 'requested') return 1
  return status === 'under-review' ? 2 : 3
}

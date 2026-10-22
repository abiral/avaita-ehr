import { err, ok, type Result } from '@/core/result'
import { isCritical, labFlag, worstFlag } from './flags'
import type { LabFlag, LabResult, RecentCollection } from './types'

/** labFlagRules: the flag for one value against its reference range. */
export const labFlagRules = labFlag

export const resultFlag = (r: Pick<LabResult, 'analytes'>): LabFlag =>
  worstFlag(r.analytes.map((a) => labFlag(a.value, a.range)))

export type ReviewEvent = 'acknowledge' | 'release'
export type ReviewRefusal = 'already-acknowledged' | 'acknowledge-critical-first' | 'already-released'

/**
 * C8 labResultReview: unreviewed -> acknowledged. Release is independent of review,
 * except that a critical result must be acknowledged before it reaches the patient.
 */
export function labResultReview(
  r: Pick<LabResult, 'analytes' | 'review' | 'releasedToPatient'>,
  event: ReviewEvent,
): Result<Pick<LabResult, 'review' | 'releasedToPatient'>, ReviewRefusal> {
  if (event === 'acknowledge')
    return r.review === 'acknowledged'
      ? err('already-acknowledged')
      : ok({ review: 'acknowledged', releasedToPatient: r.releasedToPatient })
  if (r.releasedToPatient) return err('already-released')
  if (isCritical(resultFlag(r)) && r.review !== 'acknowledged') return err('acknowledge-critical-first')
  return ok({ review: r.review, releasedToPatient: true })
}

export const DUPLICATE_WINDOW_HOURS = 24

/** Tests in the basket already collected for this patient within the window (C7 duplicate warning). */
export function duplicateWarnings(
  codes: readonly string[],
  recent: readonly RecentCollection[],
  now: Date,
  windowHours = DUPLICATE_WINDOW_HOURS,
): ReadonlyMap<string, Date> {
  const since = now.getTime() - windowHours * 3_600_000
  const found = new Map<string, Date>()
  for (const r of recent)
    if (codes.includes(r.testCode) && r.collectedAt.getTime() >= since && !found.has(r.testCode))
      found.set(r.testCode, r.collectedAt)
  return found
}

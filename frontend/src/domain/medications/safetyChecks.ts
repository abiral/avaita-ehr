import type { RefillRequest } from './types'

export type CheckId = 'potassium' | 'renal-function' | 'allergy' | 'early-refill'

/** A check that fired, with the facts to show; display text is the UI's job. */
export interface FiredCheck {
  readonly id: CheckId
  readonly facts: Readonly<Record<string, string | number>>
  /** Lab result the clinician may want to open, when the check is lab based. */
  readonly labAt: Date | null
}

export type RefillCheck = (request: RefillRequest, now: Date) => FiredCheck | null

const POTASSIUM_RAISING = ['arb', 'ace-inhibitor', 'potassium-sparing-diuretic']
const RENALLY_CLEARED: Readonly<Record<string, number>> = { biguanide: 45, arb: 30 }
const HIGH_POTASSIUM = 5.0
const EARLY_DAYS = 10
const DAY_MS = 86_400_000

const latest = (r: RefillRequest, code: string) =>
  [...r.labs].filter((l) => l.code === code).sort((a, b) => b.at.getTime() - a.at.getTime())[0]

/** ARBs, ACE inhibitors and potassium-sparing diuretics with a recent potassium above 5.0. */
export const potassiumCheck: RefillCheck = (r) => {
  const k = latest(r, 'K')
  if (!POTASSIUM_RAISING.includes(r.drugClass) || !k || k.value <= HIGH_POTASSIUM) return null
  const egfr = latest(r, 'EGFR')
  return {
    id: 'potassium',
    facts: { value: k.value, egfr: egfr?.value ?? '', medication: r.medicationName },
    labAt: k.at,
  }
}

/** Renally cleared medicines when the latest eGFR is under the medicine's threshold. */
export const renalFunctionCheck: RefillCheck = (r) => {
  const limit = RENALLY_CLEARED[r.drugClass]
  const egfr = latest(r, 'EGFR')
  if (limit === undefined || !egfr || egfr.value >= limit) return null
  return { id: 'renal-function', facts: { value: egfr.value, limit, medication: r.medicationName }, labAt: egfr.at }
}

const ALLERGY_CLASSES: Readonly<Record<string, readonly string[]>> = {
  penicillin: ['penicillin'],
  sulfonamide: ['sulfa'],
}

/** The medicine's class matches an allergy on file. */
export const allergyCheck: RefillCheck = (r) => {
  const words = ALLERGY_CLASSES[r.drugClass] ?? []
  const hit = r.allergies.find((a) => words.some((w) => a.toLowerCase().includes(w)))
  return hit ? { id: 'allergy', facts: { allergy: hit, medication: r.medicationName }, labAt: null } : null
}

/** More than ten days of the last supply should remain when the request was made. */
export const earlyRefillCheck: RefillCheck = (r) => {
  const last = r.lastDispensed
  if (!last) return null
  const runsOut = last.at.getTime() + last.quantity * DAY_MS
  const left = Math.floor((runsOut - r.requestedAt.getTime()) / DAY_MS)
  return left > EARLY_DAYS ? { id: 'early-refill', facts: { days: left }, labAt: null } : null
}

/** Every check C9 runs. Adding a check means one function here and one test. */
export const refillSafetyChecks: readonly RefillCheck[] = [
  potassiumCheck,
  renalFunctionCheck,
  allergyCheck,
  earlyRefillCheck,
]

export const firedChecks = (r: RefillRequest, now: Date): FiredCheck[] =>
  refillSafetyChecks.flatMap((check) => {
    const fired = check(r, now)
    return fired ? [fired] : []
  })

/** Approving needs every fired check acknowledged by id (the second confirmation). */
export const unacknowledged = (fired: readonly FiredCheck[], acknowledged: readonly string[]): FiredCheck[] =>
  fired.filter((f) => !acknowledged.includes(f.id))

import { daysBetween, minutesOf, weekdayOfLocal } from '../time/zone'
import type { AvailabilityBlock, LocalDate, VisitMode } from './types'

export const blockAllowsMode = (block: Pick<AvailabilityBlock, 'mode'>, mode: VisitMode): boolean =>
  block.mode === 'both' || block.mode === mode

/** Whether a weekly template block applies on a calendar date. */
export function blockAppliesOn(block: AvailabilityBlock, date: LocalDate): boolean {
  if (weekdayOfLocal(date) !== block.weekday) return false
  const since = daysBetween(block.effectiveFrom, date)
  if (since < 0) return false
  if (block.repeat === 'weekly') return true
  if (block.repeat === 'biweekly') return Math.floor(since / 7) % 2 === 0
  return since < 7
}

/** Number of bookable slots one block creates per occurrence. */
export const blockSlotCount = (
  block: Pick<AvailabilityBlock, 'start' | 'end' | 'slotMinutes'>,
  bufferMinutes = 0,
): number => {
  const span = minutesOf(block.end) - minutesOf(block.start)
  if (span <= 0 || block.slotMinutes <= 0) return 0
  return Math.floor((span + bufferMinutes) / (block.slotMinutes + bufferMinutes))
}

export interface WeeklySummary {
  readonly total: number
  readonly onsite: number
  readonly remote: number
  readonly both: number
}

/** Bookable slots per week by mode, for the A1 header. */
export function weeklySummary(blocks: readonly AvailabilityBlock[], bufferMinutes = 0): WeeklySummary {
  const acc = { total: 0, onsite: 0, remote: 0, both: 0 }
  for (const b of blocks) {
    if (b.repeat === 'once') continue
    const n = blockSlotCount(b, bufferMinutes)
    acc.total += n
    acc[b.mode] += n
  }
  return acc
}

export type BlockProblem =
  | { readonly kind: 'end-before-start' }
  | { readonly kind: 'too-short'; readonly slotMinutes: number }
  | { readonly kind: 'overlap'; readonly weekday: number; readonly with: string }
  | { readonly kind: 'no-days' }

/** Validates a new block against the existing template: start before end, at least one slot, no overlap. */
export function validateNewBlocks(
  candidates: readonly Pick<AvailabilityBlock, 'weekday' | 'start' | 'end' | 'slotMinutes'>[],
  existing: readonly Pick<AvailabilityBlock, 'weekday' | 'start' | 'end'>[],
): BlockProblem | null {
  if (candidates.length === 0) return { kind: 'no-days' }
  for (const c of candidates) {
    if (minutesOf(c.end) <= minutesOf(c.start)) return { kind: 'end-before-start' }
    if (blockSlotCount(c) === 0) return { kind: 'too-short', slotMinutes: c.slotMinutes }
    const clash = existing.find(
      (e) => e.weekday === c.weekday && minutesOf(c.start) < minutesOf(e.end) && minutesOf(e.start) < minutesOf(c.end),
    )
    if (clash) return { kind: 'overlap', weekday: c.weekday, with: `${clash.start}-${clash.end}` }
  }
  return null
}

import { err, ok, type Result } from '@/core/result'
import { addDaysIn, atLocal, localDateOf, minutesOf, overlaps, timeOf } from '../time/zone'
import { blockAllowsMode, blockAppliesOn } from './blocks'
import type { AvailabilityBlock, BookingRules, LocalDate, Practitioner, Slot, TimeOff, VisitMode } from './types'

export type SlotProblem =
  | { readonly kind: 'outside-availability' }
  | { readonly kind: 'on-leave'; readonly until: Date }
  | { readonly kind: 'too-soon'; readonly minNoticeMinutes: number }
  | { readonly kind: 'too-far'; readonly maxDaysAhead: number }
  | { readonly kind: 'mode-not-offered'; readonly mode: VisitMode }
  | { readonly kind: 'taken' }

export interface BookabilityInput {
  readonly start: Date
  readonly mode: VisitMode
  readonly blocks: readonly AvailabilityBlock[]
  readonly timeOff: readonly TimeOff[]
  readonly rules: BookingRules
  readonly practitioner: Pick<Practitioner, 'offersOnsite' | 'offersRemote'>
  readonly now: Date
  /** Facility IANA zone, for example 'Asia/Kathmandu'. */
  readonly timeZone: string
  /** Start times already booked. */
  readonly taken?: readonly Date[]
}

export const offersMode = (p: Pick<Practitioner, 'offersOnsite' | 'offersRemote'>, mode: VisitMode): boolean =>
  mode === 'onsite' ? p.offersOnsite : p.offersRemote

/** Every slot the template creates on one facility calendar date for one mode (before rules). */
export function templateSlots(
  input: Omit<BookabilityInput, 'start' | 'now' | 'rules' | 'practitioner' | 'timeOff'> & {
    readonly date: LocalDate
    readonly bufferMinutes: number
  },
): Slot[] {
  const out: Slot[] = []
  for (const b of input.blocks) {
    if (!blockAppliesOn(b, input.date) || !blockAllowsMode(b, input.mode)) continue
    const end = minutesOf(b.end)
    for (let m = minutesOf(b.start); m + b.slotMinutes <= end; m += b.slotMinutes + input.bufferMinutes) {
      const start = atLocal(input.date, timeOf(m), input.timeZone)
      out.push({ start, end: new Date(start.getTime() + b.slotMinutes * 60_000), mode: input.mode, available: true })
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

const slotLength = (input: BookabilityInput): number => {
  const date = localDateOf(input.start, input.timeZone)
  const slot = templateSlots({ ...input, date, bufferMinutes: input.rules.bufferMinutes }).find(
    (s) => s.start.getTime() === input.start.getTime(),
  )
  return slot ? slot.end.getTime() - slot.start.getTime() : 0
}

const leaveCovering = (input: BookabilityInput, length: number): TimeOff | undefined => {
  const end = new Date(input.start.getTime() + Math.max(length, 60_000))
  return input.timeOff.find((t) => overlaps(input.start, end, t.start, t.end))
}

/** Specification for a bookable slot (A1, A2, P5). The server is the authority; this explains why first. */
export function checkSlot(input: BookabilityInput): Result<true, SlotProblem> {
  if (!offersMode(input.practitioner, input.mode)) return err({ kind: 'mode-not-offered', mode: input.mode })
  if (input.start.getTime() < input.now.getTime() + input.rules.minNoticeMinutes * 60_000) {
    return err({ kind: 'too-soon', minNoticeMinutes: input.rules.minNoticeMinutes })
  }
  if (input.start.getTime() > addDaysIn(input.now, input.rules.maxDaysAhead, input.timeZone).getTime()) {
    return err({ kind: 'too-far', maxDaysAhead: input.rules.maxDaysAhead })
  }
  const length = slotLength(input)
  const leave = leaveCovering(input, length)
  if (leave) return err({ kind: 'on-leave', until: leave.end })
  if (length === 0) return err({ kind: 'outside-availability' })
  if (input.taken?.some((t) => t.getTime() === input.start.getTime())) return err({ kind: 'taken' })
  return ok(true)
}

/** All slots on a date with their availability after the rules. */
export function slotsOn(date: LocalDate, input: Omit<BookabilityInput, 'start'>): Slot[] {
  return templateSlots({ ...input, date, bufferMinutes: input.rules.bufferMinutes }).map((s) => ({
    ...s,
    available: checkSlot({ ...input, start: s.start }).ok,
  }))
}

export type DayStatus = 'open' | 'closed' | 'on-leave' | 'full'

export interface DayAvailability {
  readonly status: DayStatus
  readonly free: number
}

/** For the date strip in P5: open, closed, on leave (fully covered by time off) or full. */
export function dayStatus(date: LocalDate, input: Omit<BookabilityInput, 'start'>): DayAvailability {
  const template = templateSlots({ ...input, date, bufferMinutes: input.rules.bufferMinutes })
  if (!offersMode(input.practitioner, input.mode) || template.length === 0) return { status: 'closed', free: 0 }
  const coveredByLeave = template.every((s) => input.timeOff.some((t) => overlaps(s.start, s.end, t.start, t.end)))
  if (coveredByLeave) return { status: 'on-leave', free: 0 }
  const horizon = addDaysIn(input.now, input.rules.maxDaysAhead, input.timeZone)
  if (template.every((s) => s.start.getTime() > horizon.getTime())) return { status: 'closed', free: 0 }
  const free = slotsOn(date, input).filter((s) => s.available).length
  return free === 0 ? { status: 'full', free: 0 } : { status: 'open', free }
}

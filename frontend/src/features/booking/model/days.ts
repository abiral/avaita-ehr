import { dayStatus, type BookabilityInput, type DayAvailability } from '@/domain/scheduling/bookable'
import type { LocalDate, Slot } from '@/domain/scheduling/types'
import { addLocalDays, localDateOf } from '@/domain/time'

export const STRIP_DAYS = 7

/** The 7-day strip starting tomorrow in the facility zone. */
export const stripDates = (now: Date, timeZone: string): LocalDate[] => {
  const tomorrow = addLocalDays(localDateOf(now, timeZone), 1)
  return Array.from({ length: STRIP_DAYS }, (_, i) => addLocalDays(tomorrow, i))
}

export interface DayView extends DayAvailability {
  readonly date: LocalDate
}

/** Day status per date; server-unavailable slots count as taken so "full" matches the server. */
export function dayViews(
  dates: readonly LocalDate[],
  input: Omit<BookabilityInput, 'start'>,
  serverSlots: readonly Slot[],
): DayView[] {
  const taken = serverSlots.filter((s) => !s.available).map((s) => s.start)
  return dates.map((date) => ({ date, ...dayStatus(date, { ...input, taken }) }))
}

export const slotsOnDay = (slots: readonly Slot[], date: LocalDate, timeZone: string): Slot[] =>
  slots.filter((s) => localDateOf(s.start, timeZone) === date).sort((a, b) => a.start.getTime() - b.start.getTime())

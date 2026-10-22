import type { CalendarCell } from '@/ui'
import type { TimeOff } from '@/domain/scheduling/types'
import { initials } from '@/domain/identity'
import { addLocalDays, atLocal, daysBetween, localDateOf, localTimeOf, overlaps, weekdayOfLocal } from '@/domain/time'
import { pad2 } from '@/shared/string'
import { t } from '@/i18n'

/** First day of the month containing `date`, as yyyy-MM-01. */
export const monthStart = (date: string): string => `${date.slice(0, 7)}-01`

export const addMonths = (start: string, n: number): string => {
  const [y = 0, m = 1] = start.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${String(Math.floor(total / 12))}-${pad2((total % 12) + 1)}-01`
}

const markFor = (o: TimeOff, timeZone: string) => {
  const who = initials(o.practitionerName)
  const full = t('admin.leave.fullText', {
    doctor: o.practitionerName,
    reason: t(`admin.leave.reasons.${o.reason}`).toLowerCase(),
  })
  if (o.kind === 'full')
    return {
      label: t('admin.leave.markFull', { initials: who, reason: t(`admin.leave.reasonShort.${o.reason}`) }),
      full,
      tone: 'leave' as const,
    }
  return {
    label: t('admin.leave.markPart', {
      initials: who,
      start: localTimeOf(o.start, timeZone),
      end: localTimeOf(o.end, timeZone),
    }),
    full,
    tone: 'part' as const,
  }
}

/** Month grid (Monday first) with leave and part-day marks, computed in the facility zone. */
export function monthCells(
  start: string,
  timeOff: readonly TimeOff[],
  today: string,
  timeZone: string,
): CalendarCell[] {
  const days = daysBetween(start, addMonths(start, 1))
  const lead = weekdayOfLocal(start) - 1
  const pad = (key: string): CalendarCell => ({ key, day: '', today: false, weekend: false, marks: [] })
  const cells: CalendarCell[] = Array.from({ length: lead }, (_, i) => pad(`lead-${String(i)}`))
  for (let i = 0; i < days; i++) {
    const date = addLocalDays(start, i)
    const from = atLocal(date, '00:00', timeZone)
    const to = atLocal(addLocalDays(date, 1), '00:00', timeZone)
    const marks = timeOff.filter((o) => overlaps(o.start, o.end, from, to)).map((o) => markFor(o, timeZone))
    cells.push({ key: date, day: String(i + 1), today: date === today, weekend: weekdayOfLocal(date) === 6, marks })
  }
  while (cells.length % 7) cells.push(pad(`trail-${String(cells.length)}`))
  return cells
}

/** Upcoming entries from today, soonest first. */
export const upcoming = (timeOff: readonly TimeOff[], now: Date): TimeOff[] =>
  timeOff.filter((o) => o.end.getTime() > now.getTime()).sort((a, b) => a.start.getTime() - b.start.getTime())

export const lastDayOf = (o: TimeOff, timeZone: string): string => localDateOf(new Date(o.end.getTime() - 1), timeZone)

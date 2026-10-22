import type { TimeOff } from '@/domain/scheduling/types'
import { formatDayOfMonth, formatMonthShort, t } from '@/i18n'

const rangeOf = (o: TimeOff, timeZone: string): string => {
  const last = new Date(o.end.getTime() - 1)
  const day = (d: Date) => String(Number(formatDayOfMonth(d, timeZone)))
  const month = formatMonthShort(last, timeZone)
  if (day(o.start) === day(last)) return `${day(last)} ${month}`
  return t('portal.booking.leaveRange', { from: day(o.start), to: `${day(last)} ${month}` })
}

/** " On leave 22 to 23 Oct, 26 to 28 Oct." for full-day leave in the strip, earliest first. */
export function leaveNote(timeOff: readonly TimeOff[], timeZone: string): string {
  const full = timeOff.filter((o) => o.kind === 'full').sort((a, b) => a.start.getTime() - b.start.getTime())
  if (full.length === 0) return ''
  const range = full.map((o) => rangeOf(o, timeZone)).join(', ')
  return ` ${t('portal.booking.onLeaveUntil', { range })}`
}

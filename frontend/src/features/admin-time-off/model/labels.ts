import type { TimeOff } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { formatDayOfMonth, formatMonthShort, formatTime, formatWeekdayShort, t } from '@/i18n'
import { lastDayOf } from './calendar'

const dayNum = (d: Date, tz: string) => String(Number(formatDayOfMonth(d, tz)))

/** "Thu 22 Oct" */
export const shortDay = (d: Date, tz: string): string =>
  `${formatWeekdayShort(d, tz)} ${dayNum(d, tz)} ${formatMonthShort(d, tz)}`

/** "Mon 26 to Wed 28 Oct", or across months "Fri 30 Oct to Mon 2 Nov". */
export function dayRange(from: Date, to: Date, tz: string): string {
  if (formatMonthShort(from, tz) !== formatMonthShort(to, tz))
    return t('admin.leave.rangeDays', { from: shortDay(from, tz), to: shortDay(to, tz) })
  if (dayNum(from, tz) === dayNum(to, tz)) return shortDay(from, tz)
  return t('admin.leave.rangeDays', {
    from: `${formatWeekdayShort(from, tz)} ${dayNum(from, tz)}`,
    to: shortDay(to, tz),
  })
}

/** When an entry applies, in the facility zone. */
export function whenText(o: TimeOff, tz: string): string {
  if (o.kind === 'full') return dayRange(o.start, atLocal(lastDayOf(o, tz), '12:00', tz), tz)
  return t('admin.leave.rangeTime', {
    day: shortDay(o.start, tz),
    start: formatTime(o.start, tz),
    end: formatTime(o.end, tz),
  })
}

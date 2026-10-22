const LOCALE = 'en-GB'

const cache = new Map<string, Intl.DateTimeFormat>()
const fmt = (timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = timeZone + JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { ...options, timeZone })
    cache.set(key, f)
  }
  return f
}

/** 09:30 */
export const formatTime = (d: Date, timeZone: string): string =>
  fmt(timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)

/** 3 Nov */
export const formatShortDate = (d: Date, timeZone: string): string =>
  fmt(timeZone, { day: 'numeric', month: 'short' }).format(d)

/** 3 Nov 2026 */
export const formatDate = (d: Date, timeZone: string): string =>
  fmt(timeZone, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)

/** Tue */
export const formatWeekdayShort = (d: Date, timeZone: string): string => fmt(timeZone, { weekday: 'short' }).format(d)

/** Tuesday */
export const formatWeekday = (d: Date, timeZone: string): string => fmt(timeZone, { weekday: 'long' }).format(d)

/** Tuesday, 3 November */
export const formatDay = (d: Date, timeZone: string): string =>
  `${formatWeekday(d, timeZone)}, ${fmt(timeZone, { day: 'numeric', month: 'long' }).format(d)}`

/** Nov */
export const formatMonthShort = (d: Date, timeZone: string): string => fmt(timeZone, { month: 'short' }).format(d)

/** November 2026 */
export const formatMonthYear = (d: Date, timeZone: string): string =>
  fmt(timeZone, { month: 'long', year: 'numeric' }).format(d)

/** 03 */
export const formatDayOfMonth = (d: Date, timeZone: string): string => fmt(timeZone, { day: '2-digit' }).format(d)

/** Short zone name such as GMT+5:45 */
export const formatZone = (d: Date, timeZone: string): string =>
  fmt(timeZone, { timeZoneName: 'short' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value ?? timeZone

export const formatNumber = (n: number, digits = 0): string =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)

export const formatMoney = (minor: number, currency: string): string =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits: 0 }).format(minor / 100)

/** Wed 21 Oct */
export const formatShortDay = (d: Date, timeZone: string): string =>
  `${formatWeekdayShort(d, timeZone)} ${String(Number(formatDayOfMonth(d, timeZone)))} ${formatMonthShort(d, timeZone)}`

/** Wednesday 21 Oct */
export const formatLongDayShortMonth = (d: Date, timeZone: string): string =>
  `${formatWeekday(d, timeZone)} ${String(Number(formatDayOfMonth(d, timeZone)))} ${formatMonthShort(d, timeZone)}`

/** The viewer's own zone, used only to show a remote patient's local time next to the facility time. */
export const viewerTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

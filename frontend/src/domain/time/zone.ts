import { TZDate } from '@date-fns/tz'
import { pad2 } from '@/shared/string'
import type { LocalDate, LocalTime, Weekday } from '../scheduling/types'

/** Wall-clock parts of an instant in an IANA zone. */
export interface ZonedParts {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly weekday: Weekday
  readonly hour: number
  readonly minute: number
}

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const z = new TZDate(date, timeZone)
  const dow = z.getDay()
  return {
    year: z.getFullYear(),
    month: z.getMonth() + 1,
    day: z.getDate(),
    weekday: (dow === 0 ? 7 : dow) as Weekday,
    hour: z.getHours(),
    minute: z.getMinutes(),
  }
}

export const minutesOf = (time: LocalTime): number => {
  const [h = '0', m = '0'] = time.split(':')
  return Number(h) * 60 + Number(m)
}

export const timeOf = (minutes: number): LocalTime => `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`

export const localDateOf = (date: Date, timeZone: string): LocalDate => {
  const p = zonedParts(date, timeZone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
}

export const localTimeOf = (date: Date, timeZone: string): LocalTime => {
  const p = zonedParts(date, timeZone)
  return `${pad2(p.hour)}:${pad2(p.minute)}`
}

export const weekdayOf = (date: Date, timeZone: string): Weekday => zonedParts(date, timeZone).weekday

/** The instant at a wall-clock time on a calendar date in the zone. */
export function atLocal(date: LocalDate, time: LocalTime, timeZone: string): Date {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  const minutes = minutesOf(time)
  return new Date(new TZDate(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, timeZone).getTime())
}

export const startOfDayIn = (date: Date, timeZone: string): Date =>
  atLocal(localDateOf(date, timeZone), '00:00', timeZone)

/** Adds calendar days in the zone (keeps wall-clock time across DST changes). */
export function addDaysIn(date: Date, days: number, timeZone: string): Date {
  const p = zonedParts(date, timeZone)
  return new Date(new TZDate(p.year, p.month - 1, p.day + days, p.hour, p.minute, timeZone).getTime())
}

export const addLocalDays = (date: LocalDate, days: number): LocalDate => {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + days))
  return next.toISOString().slice(0, 10)
}

/** Whole days between two calendar dates (b minus a). */
export const daysBetween = (a: LocalDate, b: LocalDate): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)

export const weekdayOfLocal = (date: LocalDate): Weekday => {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
  return (dow === 0 ? 7 : dow) as Weekday
}

export const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean =>
  aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()

export const ageOn = (birthDate: LocalDate, today: LocalDate): number => {
  const [by = 0, bm = 1, bd = 1] = birthDate.split('-').map(Number)
  const [ty = 0, tm = 1, td = 1] = today.split('-').map(Number)
  const before = tm < bm || (tm === bm && td < bd)
  return ty - by - (before ? 1 : 0)
}

import type { LocalDate } from '@/domain/scheduling/types'
import { addLocalDays, weekdayOfLocal } from '@/domain/time'

const WORK_DAYS = 5

/** Monday to Friday of the week holding the given date. */
export function workWeek(date: LocalDate): LocalDate[] {
  const monday = addLocalDays(date, 1 - weekdayOfLocal(date))
  return Array.from({ length: WORK_DAYS }, (_, i) => addLocalDays(monday, i))
}

/** Same weekday one week earlier or later, so the selection stays put while paging. */
export const shiftWeek = (date: LocalDate, weeks: number): LocalDate => addLocalDays(date, weeks * 7)

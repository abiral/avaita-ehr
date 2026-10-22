import type { LocalDate } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { formatDay, formatDayOfMonth, formatWeekdayShort, t } from '@/i18n'
import { IconButton } from '@/ui'
import styles from '../Schedule.module.css'
import { shiftWeek, workWeek } from '../model/week'

export interface WeekPickerProps {
  readonly date: LocalDate
  readonly timeZone: string
  readonly onChange: (date: LocalDate) => void
}

/** Monday to Friday buttons with previous and next week. */
export function WeekPicker({ date, timeZone, onChange }: WeekPickerProps) {
  return (
    <div className={styles.week} role="group" aria-label={t('staff.schedule.week')}>
      <IconButton
        icon="chevronLeft"
        label={t('staff.schedule.previousWeek')}
        onClick={() => {
          onChange(shiftWeek(date, -1))
        }}
      />
      {workWeek(date).map((d) => {
        const noon = atLocal(d, '12:00', timeZone)
        return (
          <button
            key={d}
            type="button"
            className={styles.day}
            aria-pressed={d === date}
            aria-label={formatDay(noon, timeZone)}
            onClick={() => {
              onChange(d)
            }}
          >
            <span className={styles.dayWeek}>{formatWeekdayShort(noon, timeZone)}</span>
            <span className={styles.dayNum}>{formatDayOfMonth(noon, timeZone)}</span>
          </button>
        )
      })}
      <IconButton
        icon="chevronRight"
        label={t('staff.schedule.nextWeek')}
        onClick={() => {
          onChange(shiftWeek(date, 1))
        }}
      />
    </div>
  )
}

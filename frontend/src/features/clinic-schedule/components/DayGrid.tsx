import type { CSSProperties } from 'react'
import type { LocalDate } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { formatDay, formatTime, t } from '@/i18n'
import { cx } from '@/shared/cx'
import styles from '../Schedule.module.css'
import { hourLabels, ROWS, type GridItem } from '../model/grid'
import type { ClinicColumn } from '../model/useClinicDay'
import { GridEntry } from './GridEntry'

const ROW_PX = 12

export interface DayGridProps {
  readonly columns: readonly ClinicColumn[]
  readonly date: LocalDate
  readonly timeZone: string
  readonly now: Date
  readonly nowRow: number | null
}

function Column({
  name,
  day,
  items,
  timeZone,
}: {
  readonly name: string
  readonly day: string
  readonly items: readonly GridItem[]
  readonly timeZone: string
}) {
  return (
    <ol className={cx(styles.rows, styles.column)} aria-label={t('staff.schedule.column', { doctor: name, day })}>
      {items.map((item) => (
        <GridEntry key={item.id} item={item} timeZone={timeZone} />
      ))}
    </ol>
  )
}

/** C4 day view: one column per clinician from 08:00 to 17:00, with a current-time line today. */
export function DayGrid({ columns, date, timeZone, now, nowRow }: DayGridProps) {
  const day = formatDay(atLocal(date, '12:00', timeZone), timeZone)
  const vars = { '--cols': columns.length, '--rows': ROWS } as CSSProperties
  return (
    <div className={styles.inner} style={vars}>
      <div className={cx(styles.columns, styles.heads)}>
        <span />
        {columns.map((c) => (
          <span key={c.doctor.id} className={styles.head}>
            <span className={styles.headName}>{c.doctor.displayName}</span>
            <span className={styles.headRoom}>{c.doctor.location}</span>
          </span>
        ))}
      </div>
      <div className={cx(styles.columns, styles.body)}>
        <ol className={cx(styles.rows, styles.hours)} aria-hidden="true">
          {hourLabels().map((h) => (
            <li key={h.time} className={styles.hour} style={{ gridRow: `${String(h.row)} / span 6` }}>
              {h.time}
            </li>
          ))}
        </ol>
        {columns.map((c) => (
          <Column key={c.doctor.id} name={c.doctor.displayName} day={day} items={c.items} timeZone={timeZone} />
        ))}
        {nowRow === null ? null : (
          <span
            className={styles.now}
            style={{ top: (nowRow - 1) * ROW_PX }}
            role="img"
            aria-label={t('staff.schedule.now', { time: formatTime(now, timeZone) })}
          />
        )}
      </div>
    </div>
  )
}

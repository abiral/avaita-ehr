import { cx } from '@/shared/cx'
import styles from './Calendar.module.css'
import { IconButton } from './IconButton'

export type CalendarMarkTone = 'leave' | 'part'

export interface CalendarCell {
  readonly key: string
  /** Empty for padding cells outside the month. */
  readonly day: string
  readonly today: boolean
  readonly weekend: boolean
  readonly marks: readonly { readonly label: string; readonly full: string; readonly tone: CalendarMarkTone }[]
}

export interface CalendarProps {
  readonly titleId: string
  readonly title: string
  readonly weekdays: readonly string[]
  readonly cells: readonly CalendarCell[]
  readonly legend: Readonly<Record<CalendarMarkTone, string>>
  readonly prevLabel: string
  readonly nextLabel: string
  readonly onPrev: () => void
  readonly onNext: () => void
}

/** Month grid (A2). Marks carry text; color is never the only signal. */
export function Calendar(props: CalendarProps) {
  const { titleId, title, weekdays, cells, legend } = props
  return (
    <>
      <div className={styles.head}>
        <div className={styles.nav}>
          <IconButton icon="chevronLeft" label={props.prevLabel} outlined onClick={props.onPrev} />
          <h2 id={titleId} className={styles.title} aria-live="polite">
            {title}
          </h2>
          <IconButton icon="chevronRight" label={props.nextLabel} outlined onClick={props.onNext} />
        </div>
        <span className={styles.legend}>
          {(['leave', 'part'] as const).map((tone) => (
            <span key={tone} className={styles.legendItem}>
              <span className={cx(styles.swatch, styles[tone])} />
              {legend[tone]}
            </span>
          ))}
        </span>
      </div>
      <div className={styles.scroll}>
        <div className={styles.grid}>
          {weekdays.map((w) => (
            <span key={w} className={cx('cap', styles.weekday)}>
              {w}
            </span>
          ))}
          {cells.map((c) => (
            <div
              key={c.key}
              className={cx(styles.cell, (c.weekend || !c.day) && styles.muted, c.today && styles.today)}
            >
              <span className={styles.num}>{c.day}</span>
              {c.marks.map((m) => (
                <span key={m.full} className={cx(styles.mark, styles[m.tone])} title={m.full}>
                  {m.label}
                  <span className="visually-hidden">, {m.full}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

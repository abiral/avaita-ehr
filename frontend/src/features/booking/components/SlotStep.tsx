import type { LocalDate, Slot } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { formatDay, formatDayOfMonth, formatTime, formatWeekdayShort, formatZone, t, viewerTimeZone } from '@/i18n'
import { cx } from '@/shared/cx'
import { Banner, Card, SkeletonRows } from '@/ui'
import styles from '../Booking.module.css'
import type { DayView } from '../model/days'

export interface SlotStepProps {
  readonly hint: string
  readonly days: readonly DayView[] | null
  readonly day: LocalDate | null
  readonly slots: readonly Slot[]
  readonly start: Date | null
  readonly remote: boolean
  readonly timeZone: string
  readonly error: string | null
  readonly onDay: (day: LocalDate) => void
  readonly onSlot: (start: Date) => void
}

const freeText = (d: DayView): string => {
  if (d.status === 'closed') return t('portal.booking.closed')
  if (d.status === 'on-leave') return t('portal.booking.onLeave')
  if (d.status === 'full') return t('portal.booking.full')
  return t('portal.booking.free', { count: d.free })
}

function DayStrip({
  days,
  day,
  timeZone,
  onDay,
}: {
  readonly days: readonly DayView[]
  readonly day: LocalDate | null
  readonly timeZone: string
  readonly onDay: (d: LocalDate) => void
}) {
  return (
    <div className={styles.days} role="group" aria-label={t('portal.booking.days')}>
      {days.map((d) => {
        const noon = atLocal(d.date, '12:00', timeZone)
        return (
          <button
            key={d.date}
            type="button"
            className={styles.day}
            aria-pressed={d.date === day}
            aria-label={`${formatDay(noon, timeZone)}, ${freeText(d)}`}
            disabled={d.status !== 'open'}
            onClick={() => onDay(d.date)}
          >
            <span className={styles.dayWeek}>{formatWeekdayShort(noon, timeZone)}</span>
            <span className={cx('mono', styles.dayNum)}>{String(Number(formatDayOfMonth(noon, timeZone)))}</span>
            <span className={cx(styles.dayFree, d.status === 'on-leave' && styles.leave)}>{freeText(d)}</span>
          </button>
        )
      })}
    </div>
  )
}

/** P5 step 3: the date strip (dayStatus) and the slots for the chosen day, in the facility zone. */
export function SlotStep({ hint, days, day, slots, start, remote, timeZone, error, onDay, onSlot }: SlotStepProps) {
  const viewer = viewerTimeZone()
  const showLocal = remote && start && viewer !== timeZone && formatTime(start, viewer) !== formatTime(start, timeZone)
  return (
    <Card className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('portal.booking.slotTitle')}</h2>
        <span className={styles.sub}>{hint}</span>
      </div>
      {error ? <Banner tone="critical">{error}</Banner> : null}
      {days ? (
        <DayStrip days={days} day={day} timeZone={timeZone} onDay={onDay} />
      ) : (
        <SkeletonRows label={t('portal.booking.loadingSlots')} rows={2} />
      )}
      {day ? (
        <div
          className={styles.slots}
          role="group"
          aria-label={t('portal.booking.times', { day: formatDay(atLocal(day, '12:00', timeZone), timeZone) })}
        >
          {slots.map((s) => (
            <button
              key={s.start.toISOString()}
              type="button"
              className={styles.slot}
              aria-pressed={start?.getTime() === s.start.getTime()}
              disabled={!s.available}
              aria-label={s.available ? undefined : t('portal.booking.taken', { time: formatTime(s.start, timeZone) })}
              onClick={() => onSlot(s.start)}
            >
              {formatTime(s.start, timeZone)}
            </button>
          ))}
        </div>
      ) : null}
      {day && slots.every((s) => !s.available) ? (
        <span className={styles.small}>{t('portal.booking.noTimes')}</span>
      ) : null}
      {showLocal ? (
        <span className={styles.small}>
          {t('portal.booking.yourTime', { time: formatTime(start, viewer), zone: formatZone(start, viewer) })}
        </span>
      ) : null}
    </Card>
  )
}

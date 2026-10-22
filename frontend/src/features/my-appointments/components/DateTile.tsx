import { formatDayOfMonth, formatMonthShort } from '@/i18n'
import styles from '../MyAppointments.module.css'

/** Month and day tile ("Nov 03") in the facility zone. */
export function DateTile({ date, timeZone }: { readonly date: Date; readonly timeZone: string }) {
  return (
    <div className={styles.tile} aria-hidden="true">
      <span className={`cap ${styles.tileMonth ?? ''}`}>{formatMonthShort(date, timeZone)}</span>
      <span className={`mono ${styles.tileDay ?? ''}`}>{formatDayOfMonth(date, timeZone)}</span>
    </div>
  )
}

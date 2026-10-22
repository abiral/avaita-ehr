import { t } from '@/i18n'
import { Card } from '@/ui'
import styles from '../Booking.module.css'

export interface SummaryRow {
  readonly label: string
  readonly value: string
}

/** P5 summary aside. */
export function Summary({ rows }: { readonly rows: readonly SummaryRow[] }) {
  return (
    <Card as="aside" labelledBy="sum-title" className={styles.summary}>
      <h2 id="sum-title" className={styles.summaryTitle}>
        {t('portal.booking.summary')}
      </h2>
      {rows.map((r) => (
        <dl key={r.label} className={styles.sum}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </dl>
      ))}
    </Card>
  )
}

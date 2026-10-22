import type { PatientSummary } from '@/domain/clinical'
import { formatTime, t } from '@/i18n'
import { Card, Sparkline } from '@/ui'
import styles from '../Chart.module.css'

/** Five vital signs with a four-day sparkline each; the trend is also given as text. */
export function Vitals({ summary, timeZone }: { readonly summary: PatientSummary; readonly timeZone: string }) {
  const taken = summary.vitalsTakenAt
  return (
    <Card as="section" labelledBy="vitals">
      <div className={styles.hd}>
        <h2 id="vitals" className={styles.hdTitle}>
          {t('clinical.summary.vitals')}
        </h2>
        {taken ? (
          <span className={styles.muted}>
            {t('clinical.summary.vitalsTaken', { time: formatTime(taken, timeZone), by: summary.vitalsTakenBy })}
          </span>
        ) : null}
      </div>
      {summary.vitals.length === 0 ? <p className={styles.empty}>{t('clinical.summary.noVitals')}</p> : null}
      <ul className={styles.vitals}>
        {summary.vitals.map((v) => (
          <li key={v.key} className={styles.vital}>
            <span className={styles.muted}>{t(`clinical.summary.vital.${v.key}`)}</span>
            <span className={styles.vitalValue}>
              <span className={styles.big}>{v.display}</span>
              <span className={styles.unit}>{v.unit}</span>
            </span>
            <Sparkline
              values={v.trend}
              label={t('clinical.summary.trend', {
                label: t(`clinical.summary.vital.${v.key}`),
                values: v.trend.join(', '),
                unit: v.unit,
              })}
            />
            <span className={styles.small}>{v.note}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

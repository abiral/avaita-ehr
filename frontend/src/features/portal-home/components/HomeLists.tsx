import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { PatientReport } from '@/domain/labs'
import type { Medication } from '@/domain/medications'
import { formatShortDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Tag } from '@/ui'
import { MEDICINE_STATE_TONE, medicineState } from '@/features/patient-medicines'
import { flagSummary, reportRows } from '@/features/patient-reports'
import styles from '../Home.module.css'

const RECENT = 3

export function RecentReports({
  reports,
  timeZone,
}: {
  readonly reports: readonly PatientReport[]
  readonly timeZone: string
}) {
  return (
    <Card as="section" labelledBy="recent-reports" className={cx(styles.half, styles.clip)}>
      <div className={styles.cardHead}>
        <h2 id="recent-reports" className={styles.cardTitle}>
          {t('portal.home.recent')}
        </h2>
        <Link to={paths.portal.reports} className={styles.small}>
          {t('portal.home.allReports')}
        </Link>
      </div>
      {reports.length === 0 ? <p className={styles.empty}>{t('portal.home.noReports')}</p> : null}
      <ul className={styles.list}>
        {reports.slice(0, RECENT).map((r) => {
          const date = formatShortDate(r.collectedAt, timeZone)
          const out = reportRows(r).some((row) => row.flag !== 'normal')
          return (
            <li key={r.id}>
              <Link to={paths.portal.reports} className={styles.li}>
                <span className={styles.stack}>
                  <span className={styles.strong}>{r.panel}</span>
                  <span className={styles.sub}>
                    {r.reviewedBy
                      ? t('portal.home.reviewedBy', { date, doctor: r.reviewedBy })
                      : t('portal.home.reviewed', { date })}
                  </span>
                </span>
                <Tag tone={out ? 'alert' : 'neutral'}>{flagSummary(r)}</Tag>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function MyMedicines({ meds }: { readonly meds: readonly Medication[] }) {
  const current = meds.filter((m) => m.status === 'active')
  return (
    <Card as="section" labelledBy="home-meds" className={styles.clip}>
      <div className={styles.cardHead}>
        <h2 id="home-meds" className={styles.cardTitle}>
          {t('portal.home.meds')}
        </h2>
        <Link to={paths.portal.medicines} className={styles.small}>
          {t('portal.home.manage')}
        </Link>
      </div>
      {current.length === 0 ? <p className={styles.empty}>{t('portal.home.noMeds')}</p> : null}
      <ul className={styles.list}>
        {current.map((m) => {
          const state = medicineState(m)
          const text =
            state === 'active' || state === 'low'
              ? t('portal.home.daysLeft', { days: m.daysLeft })
              : t(`portal.medicines.status.${state}`)
          return (
            <li key={m.id} className={styles.li}>
              <span className={styles.stack}>
                <span className={styles.strong}>{m.name}</span>
                <span className={styles.sub}>{m.instructions}</span>
              </span>
              <Tag tone={MEDICINE_STATE_TONE[state]}>{text}</Tag>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

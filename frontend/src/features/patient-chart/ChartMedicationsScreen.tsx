import { Link } from 'react-router'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { t } from '@/i18n'
import { Page } from '@/ui'
import styles from './Chart.module.css'
import { Medications } from './components/SummaryCards'

/** Chart medications tab: active medicines, with refill requests handled in the team queue (C9). */
export function ChartMedicationsScreen() {
  const { summary } = useChartPatient()
  const { timeZone } = useTenant()
  if (!summary.data) return null
  return (
    <Page area="staff" gap={20}>
      <div className={styles.cols}>
        <div className={styles.wide}>
          <Medications summary={summary.data} timeZone={timeZone} />
        </div>
        <div className={styles.narrow}>
          <p className={styles.muted}>
            <Link to={paths.staff.medicationRequests}>{t('clinical.summary.refillQueue')}</Link>
          </p>
        </div>
      </div>
    </Page>
  )
}

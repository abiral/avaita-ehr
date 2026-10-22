import { Link } from 'react-router'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { formatTime, t } from '@/i18n'
import { Banner, Page } from '@/ui'
import styles from './Chart.module.css'
import { CareTeam, LatestResults, Medications, Problems, RecentNotes } from './components/SummaryCards'
import { Vitals } from './components/Vitals'

/** C5: critical result alert, vital signs, problems, notes, medications, latest results and care team. */
export function ChartSummaryScreen() {
  const { summary } = useChartPatient()
  const { timeZone } = useTenant()
  const data = summary.data
  if (!data) return null
  const alert = data.alert
  return (
    <Page area="staff" gap={20}>
      {alert ? (
        <Banner
          tone="critical"
          title={t('clinical.summary.critical', { time: formatTime(alert.at, timeZone) })}
          action={
            <Link className={styles.criticalLink} to={paths.staff.chartResult(data.banner.id, alert.resultId)}>
              {t('clinical.summary.review')}
            </Link>
          }
        >
          {t('clinical.summary.criticalText', { analyte: alert.analyte, value: alert.value, range: alert.range })}
        </Banner>
      ) : null}
      <Vitals summary={data} timeZone={timeZone} />
      <div className={styles.cols}>
        <div className={styles.wide}>
          <Problems summary={data} timeZone={timeZone} />
          <RecentNotes summary={data} timeZone={timeZone} />
        </div>
        <div className={styles.narrow}>
          <Medications summary={data} timeZone={timeZone} />
          <LatestResults summary={data} timeZone={timeZone} />
          <CareTeam summary={data} timeZone={timeZone} />
        </div>
      </div>
    </Page>
  )
}

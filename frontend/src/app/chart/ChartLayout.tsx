import { Outlet } from 'react-router'
import { hasCode } from '@/core/errors'
import { t } from '@/i18n'
import { Banner, Button, SkeletonRows } from '@/ui'
import { useServices } from '../ServicesProvider'
import { useTenant } from '../TenantProvider'
import styles from './Chart.module.css'
import { PatientBanner } from './PatientBanner'
import { useChartPatient } from './useChartPatient'

/** Layout route for /staff/patients/:patientId: the banner renders here so no chart screen can omit it. */
export function ChartLayout() {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const { summary } = useChartPatient()
  if (summary.isPending)
    return (
      <div className={styles.state}>
        <SkeletonRows label={t('clinical.banner.loading')} rows={3} />
      </div>
    )
  if (summary.isError) {
    const missing = hasCode(summary.error, 'not_found')
    return (
      <div className={styles.state}>
        <Banner
          tone="critical"
          action={
            missing ? undefined : (
              <Button size="sm" onClick={() => void summary.refetch()}>
                {t('clinical.banner.retry')}
              </Button>
            )
          }
        >
          {missing ? t('clinical.banner.notFound') : t('clinical.banner.loadFailed')}
        </Banner>
      </div>
    )
  }
  return (
    <>
      <PatientBanner banner={summary.data.banner} now={clock.now()} timeZone={timeZone} />
      <Outlet />
    </>
  )
}

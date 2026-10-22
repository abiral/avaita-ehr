import { Link } from 'react-router'
import { formatLabValue, t } from '@/i18n'
import { Banner } from '@/ui'
import { paths } from '../routes'
import styles from './Chart.module.css'
import type { CriticalAlert } from './useCriticalAlerts'

/** Persistent banner under the top bar for critical results that arrived over realtime. */
export function CriticalAlerts({ alerts }: { readonly alerts: readonly CriticalAlert[] }) {
  if (alerts.length === 0) return null
  return (
    <div className={styles.alerts} aria-label={t('clinical.alerts.region')} role="region">
      {alerts.map(({ result, analyte }) => (
        <Banner
          key={result.id}
          tone="critical"
          action={
            <Link className={styles.alertLink} to={paths.staff.result(result.id)}>
              {t('clinical.alerts.review')}
            </Link>
          }
        >
          {t('clinical.alerts.text', {
            patient: result.patientName,
            analyte: analyte.name,
            value: formatLabValue(analyte.value),
            unit: analyte.unit,
          })}
        </Banner>
      ))}
    </div>
  )
}

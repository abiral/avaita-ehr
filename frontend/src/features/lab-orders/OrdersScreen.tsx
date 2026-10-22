import { useChartPatient } from '@/app/chart/useChartPatient'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { t } from '@/i18n'
import { Page } from '@/ui'
import { Basket } from './components/Basket'
import { Catalogue } from './components/Catalogue'
import { addSet } from './model/basket'
import { useLabOrder } from './model/useLabOrder'
import styles from './Orders.module.css'

/** C7: lab ordering from the catalogue or an order set, with a duplicate warning for recent tests. */
export function OrdersScreen() {
  const o = useLabOrder()
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const banner = useChartPatient().summary.data?.banner
  return (
    <Page area="staff" gap={20}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('clinical.orders.title')}</h2>
        {banner ? (
          <span className={styles.muted}>
            {t('clinical.orders.sub', { patient: banner.displayName, mrn: banner.mrn })}
          </span>
        ) : null}
      </div>
      <div className={styles.layout}>
        <Catalogue o={o} onAddSet={(set) => o.changeBasket(addSet(o.basket, set))} />
        <Basket o={o} now={clock.now()} timeZone={timeZone} />
      </div>
    </Page>
  )
}

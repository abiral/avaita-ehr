import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { STEP_INDEX } from '@/domain/appointments'
import { t } from '@/i18n'
import { Page } from '@/ui'
import styles from './Booking.module.css'
import { BookingNav } from './components/BookingNav'
import { Steps } from './components/Steps'
import { StepBody } from './components/StepBody'
import { Summary } from './components/Summary'
import { summaryRows } from './model/summary'
import { useBookingFlow, type FlowStart } from './model/useBookingFlow'

/** P5: find a doctor, choose on-site or remote, pick a slot, confirm. */
export function BookingFlow({ start }: { readonly start: FlowStart }) {
  const flow = useBookingFlow(start)
  const tenant = useTenant()
  const { state } = flow
  return (
    <Page area="portal" gap={24}>
      <div className={styles.head}>
        <Link to={paths.portal.appointments} className={styles.crumb}>
          {t('portal.booking.back')}
        </Link>
        <h1 className={styles.title}>
          {flow.rescheduling ? t('portal.booking.rescheduleTitle') : t('portal.booking.title')}
        </h1>
      </div>
      <Steps current={STEP_INDEX[state.step]} />
      <div className={styles.layout}>
        <section className={styles.main} aria-label={t('portal.booking.title')}>
          <StepBody flow={flow} />
          <BookingNav flow={flow} />
        </section>
        <Summary rows={summaryRows(flow, tenant.facility?.shortName ?? '', tenant.timeZone)} />
      </div>
    </Page>
  )
}

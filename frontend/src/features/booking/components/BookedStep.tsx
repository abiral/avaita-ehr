import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { ButtonLink, Card, Icon } from '@/ui'
import { cx } from '@/shared/cx'
import styles from '../Booking.module.css'
import { icsHref, toIcs } from '../model/calendarFile'

export interface BookedStepProps {
  readonly rescheduled: boolean
  readonly reference: string
  readonly text: string
  readonly event: { readonly start: Date; readonly end: Date; readonly title: string; readonly location: string }
}

/** P5 done: confirmation with reference, a link to My appointments and a calendar file. */
export function BookedStep({ rescheduled, reference, text, event }: BookedStepProps) {
  return (
    <Card className={cx(styles.panel, styles.done)}>
      <span className={styles.doneIcon}>
        <Icon name="check" size={22} strokeWidth={2} />
      </span>
      <div className={styles.panelHead} role="status">
        <h2 className={styles.panelTitle}>
          {rescheduled ? t('portal.booking.rescheduledTitle') : t('portal.booking.bookedTitle')}
        </h2>
        <p className={styles.sub}>{text}</p>
      </div>
      <span className={styles.small}>
        {t('portal.booking.reference')} <span className={styles.mono}>{reference}</span>
      </span>
      <div className={styles.buttons}>
        <ButtonLink to={paths.portal.appointments} variant="primary" size="lg">
          {t('portal.booking.viewAppointments')}
        </ButtonLink>
        <a
          className={styles.calendarLink}
          href={icsHref(toIcs({ uid: reference, ...event }))}
          download="appointment.ics"
        >
          {t('portal.booking.addToCalendar')}
        </a>
      </div>
    </Card>
  )
}

import { paths } from '@/app/routes'
import { cancellation, type Appointment } from '@/domain/appointments'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Button, ButtonLink, Card, Tag } from '@/ui'
import { STATUS_TONE, whenLine, whereLine } from '../model/labels'
import styles from '../MyAppointments.module.css'
import { DateTile } from './DateTile'

export interface AppointmentCardProps {
  readonly appointment: Appointment
  readonly past: boolean
  readonly now: Date
  readonly cutoffMinutes: number
  readonly timeZone: string
  readonly onCancel: (a: Appointment) => void
}

function Actions({ appointment: a, now, cutoffMinutes, timeZone, onCancel }: Omit<AppointmentCardProps, 'past'>) {
  if (a.status !== 'booked') return null
  const check = cancellation(a, now, cutoffMinutes, 'patient')
  const when = whenLine(a, timeZone)
  if (!check.ok)
    return <span className={styles.closed}>{t('portal.appointments.windowClosed', { hours: cutoffMinutes / 60 })}</span>
  return (
    <div className={styles.actions}>
      {a.practitionerId ? (
        <ButtonLink to={`${paths.portal.book}?reschedule=${encodeURIComponent(a.id)}`}>
          <span aria-hidden="true">{t('portal.appointments.reschedule')}</span>
          <span className="visually-hidden">{t('portal.appointments.rescheduleFor', { when })}</span>
        </ButtonLink>
      ) : null}
      <Button size="lg" aria-label={t('portal.appointments.cancelFor', { when })} onClick={() => onCancel(a)}>
        {t('portal.appointments.cancel')}
      </Button>
    </div>
  )
}

/** One appointment with date tile, status text, time in the facility zone and actions. */
export function AppointmentCard(props: AppointmentCardProps) {
  const { appointment: a, past, timeZone } = props
  return (
    <Card as="article" className={cx(styles.card, a.status === 'cancelled' && !past && styles.faded)}>
      <DateTile date={a.start} timeZone={timeZone} />
      <div className={styles.body}>
        <span className={styles.titleRow}>
          <span className={styles.name}>{a.title}</span>
          <Tag tone={STATUS_TONE[a.status]}>{t(`portal.appointments.status.${a.status}`)}</Tag>
        </span>
        <span className={styles.when}>{whenLine(a, timeZone)}</span>
        <span className={styles.where}>{whereLine(a, past)}</span>
      </div>
      {past ? null : <Actions {...props} />}
    </Card>
  )
}

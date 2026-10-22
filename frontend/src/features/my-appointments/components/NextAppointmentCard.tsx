import { paths } from '@/app/routes'
import type { Appointment } from '@/domain/appointments'
import { formatTime, formatWeekday, t } from '@/i18n'
import { ButtonLink, Card, CardHeader, EmptyState, Tag } from '@/ui'
import styles from '../Next.module.css'
import { DateTile } from './DateTile'

/** P4: the next booked visit with Reschedule and Cancel shortcuts. */
export function NextAppointmentCard({
  appointment,
  category,
  timeZone,
}: {
  readonly appointment: Appointment | null
  readonly category: string
  readonly timeZone: string
}) {
  if (!appointment) {
    return (
      <Card as="section" labelledBy="next-appt" className={styles.card}>
        <CardHeader id="next-appt" title={t('portal.next.title')} />
        <EmptyState
          title={t('portal.next.none')}
          body={t('portal.next.noneBody')}
          action={
            <ButtonLink to={paths.portal.book} variant="primary">
              {t('portal.appointments.book')}
            </ButtonLink>
          }
        />
      </Card>
    )
  }
  const a = appointment
  return (
    <Card as="section" labelledBy="next-appt" className={styles.card}>
      <div className={styles.head}>
        <h2 id="next-appt" className={styles.title}>
          {t('portal.next.title')}
        </h2>
        <Tag tone="info">{t('portal.appointments.status.booked')}</Tag>
      </div>
      <div className={styles.row}>
        <DateTile date={a.start} timeZone={timeZone} />
        <div className={styles.text}>
          <span className={styles.when}>{`${formatWeekday(a.start, timeZone)}, ${formatTime(a.start, timeZone)}`}</span>
          <span>{a.kind === 'lab' ? a.title : t('portal.next.with', { doctor: a.practitionerName, category })}</span>
          <span className={styles.where}>
            {t('portal.next.where', { reason: a.reason, location: a.location.split(' · ').pop() ?? a.location })}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {a.practitionerId ? (
          <ButtonLink to={`${paths.portal.book}?reschedule=${encodeURIComponent(a.id)}`} size="lg">
            {t('portal.appointments.reschedule')}
          </ButtonLink>
        ) : null}
        <ButtonLink to={paths.portal.appointments} size="lg">
          {t('portal.appointments.cancel')}
        </ButtonLink>
      </div>
    </Card>
  )
}

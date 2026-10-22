import { paths } from '@/app/routes'
import type { Appointment } from '@/domain/appointments'
import { formatTime, formatWeekday, t } from '@/i18n'
import { buttonClass, ButtonLink, Card, CardHeader, EmptyState, Tag } from '@/ui'
import { icsHref, toIcs } from '@/features/booking'
import styles from '../Next.module.css'
import { DateTile } from './DateTile'

function NoNextAppointment() {
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

function NextActions({ a }: { readonly a: Appointment }) {
  return (
    <div className={styles.actions}>
      {a.practitionerId ? (
        <ButtonLink to={`${paths.portal.book}?reschedule=${encodeURIComponent(a.id)}`} size="lg">
          {t('portal.appointments.reschedule')}
        </ButtonLink>
      ) : null}
      <ButtonLink to={paths.portal.appointments} size="lg">
        {t('portal.appointments.cancel')}
      </ButtonLink>
      <a
        className={buttonClass('secondary', 'lg')}
        download="appointment.ics"
        href={icsHref(
          toIcs({
            uid: a.id,
            start: a.start,
            end: a.end,
            title: a.kind === 'lab' ? a.title : a.practitionerName,
            location: a.location,
          }),
        )}
      >
        {t('portal.booking.addToCalendar')}
      </a>
    </div>
  )
}

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
  if (!appointment) return <NoNextAppointment />
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
      <NextActions a={a} />
    </Card>
  )
}

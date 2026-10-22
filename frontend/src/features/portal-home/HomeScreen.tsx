import { useSession } from '@/app/session/SessionProvider'
import { sessionOf } from '@/app/session/sessionState'
import { useTenant } from '@/app/TenantProvider'
import { formatDayOfMonth, formatMonthLong, t } from '@/i18n'
import { Card, Icon, Page, SkeletonRows } from '@/ui'
import { NextAppointmentCard } from '@/features/my-appointments'
import { MyMedicines, RecentReports } from './components/HomeLists'
import { Shortcuts } from './components/Shortcuts'
import styles from './Home.module.css'
import { useHome } from './useHome'

function Greeting() {
  const session = sessionOf(useSession().state)
  const { facility } = useTenant()
  const name = session?.kind === 'patient' ? session.givenName : ''
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>{t('portal.home.hello', { name })}</h1>
      <p className={styles.muted}>{t('portal.home.care', { facility: facility?.name ?? '' })}</p>
    </div>
  )
}

/** P4: greeting, preparation reminder, shortcuts, next appointment, recent reports and medicines. */
export function HomeScreen() {
  const h = useHome()
  const { timeZone } = useTenant()
  const prep = h.prep
  return (
    <Page area="portal" gap={28}>
      <Greeting />
      {prep ? (
        <div className={styles.prep} role="note">
          <span className={styles.prepIcon}>
            <Icon name="info" size={18} />
          </span>
          <span>
            <strong>
              {t('portal.home.prep', {
                what: t('portal.home.bloodTest'),
                date: `${String(Number(formatDayOfMonth(prep.start, timeZone)))} ${formatMonthLong(prep.start, timeZone)}`,
              })}
            </strong>{' '}
            {prep.preparation}
          </span>
        </div>
      ) : null}
      <Shortcuts newReports={(h.reports.data ?? []).filter((r) => r.isNew).length} />
      <div className={styles.row}>
        <div className={styles.half}>
          {h.appointments.isPending ? (
            <Card>
              <SkeletonRows label={t('portal.home.loading')} rows={3} />
            </Card>
          ) : (
            <NextAppointmentCard appointment={h.next} category={h.category} timeZone={timeZone} />
          )}
        </div>
        <RecentReports reports={h.reports.data ?? []} timeZone={timeZone} />
      </div>
      <MyMedicines meds={h.medicines.data?.medications ?? []} />
    </Page>
  )
}

import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { t } from '@/i18n'
import { ButtonLink, Card, EmptyState, Page, SkeletonRows, Tabs } from '@/ui'
import { AppointmentCard } from './components/AppointmentCard'
import { CancelDialog } from './components/CancelDialog'
import { NoticeBar } from './components/NoticeBar'
import { useMyAppointments } from './model/useMyAppointments'
import styles from './MyAppointments.module.css'

type Screen = ReturnType<typeof useMyAppointments>

function Empty({ tab }: { readonly tab: Screen['tab'] }) {
  return (
    <Card>
      {tab === 'upcoming' ? (
        <EmptyState title={t('portal.appointments.noneUpcoming')} body={t('portal.appointments.noneUpcomingBody')} />
      ) : (
        <EmptyState title={t('portal.appointments.nonePast')} />
      )}
    </Card>
  )
}

function List({ s, timeZone }: { readonly s: Screen; readonly timeZone: string }) {
  const rows = s.tab === 'upcoming' ? s.split.upcoming : s.split.past
  return (
    <div id="appts-panel" role="tabpanel" aria-labelledby={`appts-${s.tab}`} className={styles.list}>
      {s.list.isPending ? (
        <Card>
          <SkeletonRows label={t('portal.appointments.loading')} rows={3} />
        </Card>
      ) : null}
      {!s.list.isPending && rows.length === 0 ? <Empty tab={s.tab} /> : null}
      {rows.map((a) => (
        <AppointmentCard
          key={a.id}
          appointment={a}
          past={s.tab === 'past'}
          now={s.now}
          cutoffMinutes={s.cutoffMinutes}
          timeZone={timeZone}
          onCancel={s.setAsking}
        />
      ))}
    </div>
  )
}

/** P7: upcoming and past appointments, cancel with reason and Undo, reschedule. */
export function MyAppointmentsScreen() {
  const s = useMyAppointments()
  const { timeZone } = useTenant()
  const upcomingCount = s.split.upcoming.filter((a) => a.status !== 'cancelled').length
  return (
    <Page area="portal" gap={24}>
      <div className={styles.head}>
        <h1 className={styles.title}>{t('portal.appointments.title')}</h1>
        <ButtonLink to={paths.portal.book} variant="primary" size="lg">
          {t('portal.appointments.book')}
        </ButtonLink>
      </div>
      <NoticeBar
        notice={s.notice}
        onUndo={() => s.notice?.kind === 'cancelled' && s.undo.mutate(s.notice.appointment)}
      />
      <Tabs
        label={t('portal.appointments.tabs')}
        idPrefix="appts"
        value={s.tab}
        onChange={s.setTab}
        items={[
          { value: 'upcoming', label: t('portal.appointments.upcoming'), count: upcomingCount },
          { value: 'past', label: t('portal.appointments.past') },
        ]}
      />
      <List s={s} timeZone={timeZone} />
      {s.asking ? (
        <CancelDialog
          appointment={s.asking}
          cutoffHours={s.cutoffMinutes / 60}
          timeZone={timeZone}
          busy={s.cancel.isPending}
          onKeep={() => s.setAsking(null)}
          onCancel={(reason) => s.asking && s.cancel.mutate({ appointment: s.asking, reason })}
        />
      ) : null}
    </Page>
  )
}

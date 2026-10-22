import { paths } from '@/app/routes'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { formatDay, t } from '@/i18n'
import { Banner, Button, ButtonLink, Card, Page, SkeletonRows } from '@/ui'
import { Agenda, MyPatients, NeedsAttention, Stats } from './components/TodayCards'
import { useToday, useWardPatients } from './model/useWard'
import styles from './Ward.module.css'

/** C2: the clinician's day: counts, my patients, what needs attention and the agenda. */
export function TodayScreen() {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const today = useToday()
  const patients = useWardPatients()
  const now = clock.now()
  const mine = (patients.data ?? []).filter((p) => p.mine)
  const failed = today.isError || patients.isError
  return (
    <Page area="staff" gap={24}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <span className="cap">{formatDay(now, timeZone)}</span>
          <h1 className={styles.title}>{t('staff.today.title')}</h1>
        </div>
        <div className={styles.buttons}>
          <ButtonLink to={paths.staff.patients}>{t('staff.today.handover')}</ButtonLink>
        </div>
      </div>
      {failed ? (
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={() => void Promise.all([today.refetch(), patients.refetch()])}>
              {t('staff.today.retry')}
            </Button>
          }
        >
          {t('staff.today.loadFailed')}
        </Banner>
      ) : null}
      {today.data && patients.data ? (
        <>
          <Stats today={today.data} mine={mine.length} />
          <div className={styles.cols}>
            <MyPatients patients={mine} now={now} timeZone={timeZone} />
            <div className={styles.narrow}>
              <NeedsAttention items={today.data.attention} />
              <Agenda items={today.data.agenda} timeZone={timeZone} />
            </div>
          </div>
        </>
      ) : failed ? null : (
        <Card>
          <SkeletonRows label={t('staff.today.loading')} rows={6} />
        </Card>
      )}
    </Page>
  )
}

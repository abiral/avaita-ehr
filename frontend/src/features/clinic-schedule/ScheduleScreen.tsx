import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { localDateOf } from '@/domain/time'
import { t } from '@/i18n'
import { Banner, Button, Card, EmptyState, Page, PageHeader, SkeletonRows } from '@/ui'
import { BookForPanel } from './components/BookForPanel'
import { DayGrid } from './components/DayGrid'
import { WeekPicker } from './components/WeekPicker'
import { nowRow } from './model/grid'
import { useClinicDay } from './model/useClinicDay'
import styles from './Schedule.module.css'

function GridBody({
  day,
  date,
  timeZone,
  now,
}: {
  readonly day: ReturnType<typeof useClinicDay>
  readonly date: string
  readonly timeZone: string
  readonly now: Date
}) {
  if (day.failed)
    return (
      <div className={styles.loading}>
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={day.retry}>
              {t('staff.schedule.retry')}
            </Button>
          }
        >
          {t('staff.schedule.loadFailed')}
        </Banner>
      </div>
    )
  if (day.loading) return <SkeletonRows label={t('staff.schedule.loading')} rows={6} />
  if (day.columns.length === 0) return <EmptyState title={t('staff.schedule.noClinicians')} />
  return (
    <div className={styles.scroll}>
      <DayGrid columns={day.columns} date={date} timeZone={timeZone} now={now} nowRow={nowRow(now, date, timeZone)} />
    </div>
  )
}

/** C4: day view per clinician and booking on behalf of a patient. */
export function ScheduleScreen() {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const now = clock.now()
  const [date, setDate] = useState(() => localDateOf(now, timeZone))
  const day = useClinicDay(date)
  return (
    <Page area="staff" gap={20}>
      <PageHeader
        eyebrow={t('staff.schedule.eyebrow')}
        title={t('staff.schedule.title')}
        actions={<WeekPicker date={date} timeZone={timeZone} onChange={setDate} />}
      />
      <div className={styles.layout}>
        <Card as="section" className={styles.gridCard} labelledBy="day-schedule">
          <h2 id="day-schedule" className="visually-hidden">
            {t('staff.schedule.grid')}
          </h2>
          <GridBody day={day} date={date} timeZone={timeZone} now={now} />
        </Card>
        <BookForPanel doctors={day.doctors} date={date} timeZone={timeZone} />
      </div>
    </Page>
  )
}

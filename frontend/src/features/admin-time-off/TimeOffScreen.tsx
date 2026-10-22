import { useTenant } from '@/app/TenantProvider'
import { atLocal } from '@/domain/time'
import { formatMonthYear, t } from '@/i18n'
import { Calendar, Card, Page, PageHeader, StatusMessage } from '@/ui'
import { FormPanel } from './components/FormPanel'
import { UpcomingList } from './components/UpcomingList'
import { addMonths, monthCells } from './model/calendar'
import { dayRange } from './model/labels'
import { useTimeOffScreen } from './model/useTimeOffScreen'
import styles from './TimeOff.module.css'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const

/** A2: calendar of leave, upcoming blocks and the block-time form with impact check. */
export function TimeOffScreen() {
  const s = useTimeOffScreen()
  const { timeZone } = useTenant()
  const noon = (date: string) => atLocal(date, '12:00', timeZone)
  const range = dayRange(noon(s.draft.from), noon(s.draft.kind === 'part' ? s.draft.from : s.draft.to), timeZone)
  return (
    <Page area="staff" width={1200} gap={20}>
      <PageHeader eyebrow={t('admin.scheduling')} title={t('admin.leave.title')} sub={t('admin.leave.sub')} />
      {s.form.status === 'saved' ? (
        <StatusMessage>
          {t('admin.leave.savedToast', { slots: s.form.impact.removedSlots, count: s.form.impact.affected.length })}
        </StatusMessage>
      ) : null}
      <div className={styles.layout}>
        <div className={styles.main}>
          <Card as="section" labelledBy="cal">
            <Calendar
              titleId="cal"
              title={formatMonthYear(noon(s.month), timeZone)}
              weekdays={WEEKDAYS.map((d) => t(`admin.days.${d}`))}
              cells={monthCells(s.month, s.lists.calendar.data ?? [], s.today, timeZone)}
              legend={{ leave: t('admin.leave.legendLeave'), part: t('admin.leave.legendPart') }}
              prevLabel={t('admin.leave.prevMonth')}
              nextLabel={t('admin.leave.nextMonth')}
              onPrev={() => s.setMonth((m) => addMonths(m, -1))}
              onNext={() => s.setMonth((m) => addMonths(m, 1))}
            />
          </Card>
          <UpcomingList items={s.lists.upcomingItems} loading={s.lists.upcomingLoading} timeZone={timeZone} />
        </div>
        <FormPanel
          form={s.form}
          draft={s.draft}
          doctors={s.doctors.all}
          range={range}
          timeZone={timeZone}
          onChange={(p) => s.setDraft((d) => ({ ...d, ...p }))}
          actions={s}
        />
      </div>
    </Page>
  )
}

import { paths } from '@/app/routes'
import type { Weekday } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Banner, ButtonLink, Page, PageHeader, StatusMessage } from '@/ui'
import styles from './Availability.module.css'
import { DoctorNav } from './components/DoctorNav'
import { NewBlockForm } from './components/NewBlockForm'
import { RulesCard } from './components/RulesCard'
import { WeeklyTemplate } from './components/WeeklyTemplate'
import type { AvailabilityStatus } from './model/useAvailabilityMutations'
import { useAvailabilityScreen } from './model/useAvailabilityScreen'

const STATUS = { saved: 'admin.blocks.saved', removed: 'admin.blocks.removed', rules: 'admin.rules.saved' } as const

function PageStatus({
  status,
  doctor,
  days,
}: {
  readonly status: AvailabilityStatus
  readonly doctor: string
  readonly days: readonly Weekday[]
}) {
  if (!status) return null
  if (status.tone === 'error') return <Banner tone="critical">{status.text}</Banner>
  return (
    <StatusMessage>
      {t(STATUS[status.kind], { doctor, days: days.map((d) => t(`admin.days.${d}`)).join(', ') })}
    </StatusMessage>
  )
}

/** A1: weekly appointment blocks per doctor and the facility booking rules. */
export function AvailabilityScreen() {
  const s = useAvailabilityScreen()
  const name = s.doctor?.displayName ?? ''
  return (
    <Page area="staff" width={1200} gap={20}>
      <PageHeader
        eyebrow={t('admin.scheduling')}
        title={t('admin.blocks.title')}
        sub={t('admin.blocks.sub')}
        actions={<ButtonLink to={paths.admin.timeOff}>{t('admin.blocks.toLeave')}</ButtonLink>}
      />
      <PageStatus status={s.status} doctor={name} days={s.form.days} />
      <div className={styles.layout}>
        <DoctorNav
          doctors={s.doctors.visible}
          selectedId={s.doctor?.id ?? null}
          q={s.doctors.q}
          loading={s.doctors.query.isPending}
          onQ={s.doctors.setQ}
          onPick={s.pickDoctor}
        />
        <div className={styles.main}>
          <WeeklyTemplate
            doctorName={name}
            blocks={s.blocks.data ?? []}
            loading={s.blocks.isPending}
            bufferMinutes={s.rules.data?.bufferMinutes ?? 0}
            onAdd={(d) => s.setForm((f) => ({ ...f, days: [d] }))}
            onRemove={(id) => s.removeBlock.mutate(id)}
          />
          <RulesCard rules={s.rules.data} onChange={(r) => s.saveRules.mutate(r)} />
        </div>
        <NewBlockForm
          doctorName={name}
          form={s.form}
          problem={s.problem}
          busy={s.saveBlock.isPending}
          onChange={(p) => s.setForm((f) => ({ ...f, ...p }))}
          onSubmit={() => s.saveBlock.mutate()}
        />
      </div>
    </Page>
  )
}

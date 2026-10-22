import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useSession } from '@/app/session/SessionProvider'
import { sessionOf } from '@/app/session/sessionState'
import { useTenant } from '@/app/TenantProvider'
import type { PatientListItem } from '@/domain/clinical'
import { formatTime, t } from '@/i18n'
import { Banner, Button, Card, EmptyState, Page, SegmentedControl, SkeletonRows, Table, Tag } from '@/ui'
import { PatientCell } from './components/PatientCell'
import { admissionDay, bedNumber, demographics, FLAG_TONE } from './model/patientRows'
import { useWardPatients } from './model/useWard'
import styles from './Ward.module.css'

type Scope = 'mine' | 'ward'

function PatientTable({
  rows,
  now,
  timeZone,
}: {
  readonly rows: readonly PatientListItem[]
  readonly now: Date
  readonly timeZone: string
}) {
  return (
    <Table
      caption={t('staff.patients.list')}
      rows={rows}
      rowKey={(p) => p.id}
      minWidth={920}
      columns={[
        {
          key: 'bed',
          header: t('staff.patients.columns.bed'),
          width: '48px',
          cell: (p) => <span className={styles.bed}>{bedNumber(p.bed)}</span>,
        },
        {
          key: 'patient',
          header: t('staff.patients.columns.patient'),
          cell: (p) => <PatientCell p={p} now={now} timeZone={timeZone} />,
        },
        { key: 'attending', header: t('staff.patients.columns.attending'), cell: (p) => p.attendingName ?? '' },
        {
          key: 'day',
          header: t('staff.patients.columns.day'),
          width: '72px',
          cell: (p) => <span className={styles.bed}>{admissionDay(p, now, timeZone) ?? ''}</span>,
        },
        { key: 'dx', header: t('staff.patients.columns.diagnosis'), cell: (p) => p.diagnosis },
        {
          key: 'flags',
          header: t('staff.patients.columns.flags'),
          cell: (p) => (
            <span className={styles.flags}>
              {p.flags.map((f) => (
                <Tag key={f} tone={FLAG_TONE[f]}>
                  {t(`staff.patients.flags.${f}`)}
                </Tag>
              ))}
            </span>
          ),
        },
        {
          key: 'status',
          header: t('staff.patients.columns.status'),
          width: '150px',
          cell: (p) => <Tag tone={p.nextTone}>{p.next}</Tag>,
        },
      ]}
    />
  )
}

function usePrintHandover(rows: readonly PatientListItem[], unit: string) {
  const { printer, clock } = useServices()
  const { timeZone } = useTenant()
  const session = sessionOf(useSession().state)
  return () =>
    printer.print({
      title: t('staff.patients.handoverTitle', { unit }),
      patientName: '',
      mrn: '',
      printedBy: session?.displayName ?? '',
      sections: rows.map((p) => ({
        heading: `${bedNumber(p.bed)} · ${p.displayName}`,
        lines: [demographics(p, clock.now(), timeZone), p.diagnosis, p.next],
      })),
    })
}

const unitOf = (d: { readonly unit: string; readonly name: string } | null): string => {
  if (!d) return ''
  return d.unit.length > 0 ? d.unit : d.name
}

function ListCard({
  q,
  rows,
  now,
  timeZone,
}: {
  readonly q: ReturnType<typeof useWardPatients>
  readonly rows: readonly PatientListItem[]
  readonly now: Date
  readonly timeZone: string
}) {
  return (
    <Card as="section" labelledBy="patient-list" className={styles.clip}>
      <h2 id="patient-list" className="visually-hidden">
        {t('staff.patients.list')}
      </h2>
      {q.isPending ? <SkeletonRows label={t('staff.patients.loading')} rows={8} /> : null}
      {q.isSuccess && rows.length === 0 ? <EmptyState title={t('staff.patients.empty')} /> : null}
      {rows.length > 0 ? <PatientTable rows={rows} now={now} timeZone={timeZone} /> : null}
      <div className={styles.foot}>
        <span>{t('staff.patients.shown', { count: rows.length })}</span>
        {q.dataUpdatedAt > 0 ? (
          <span>{t('staff.patients.updated', { time: formatTime(new Date(q.dataUpdatedAt), timeZone) })}</span>
        ) : null}
      </div>
    </Card>
  )
}

function Head({
  eyebrow,
  canPrint,
  onPrint,
}: {
  readonly eyebrow: string
  readonly canPrint: boolean
  readonly onPrint: () => void
}) {
  return (
    <div className={styles.head}>
      <div className={styles.titleBlock}>
        <span className="cap">{eyebrow}</span>
        <h1 className={styles.title}>{t('staff.patients.title')}</h1>
      </div>
      <div className={styles.buttons}>
        <Button disabled={!canPrint} onClick={onPrint}>
          {t('staff.patients.printHandover')}
        </Button>
      </div>
    </div>
  )
}

/** C3: ward census with my patients or the whole ward, flags in words and status. */
export function PatientsScreen() {
  const { clock } = useServices()
  const { timeZone, facility, department } = useTenant()
  const patients = useWardPatients()
  const [scope, setScope] = useState<Scope>('mine')
  const all = patients.data ?? []
  const mineCount = all.filter((p) => p.mine).length
  const rows = scope === 'mine' ? all.filter((p) => p.mine) : all
  const unit = unitOf(department)
  const print = usePrintHandover(rows, unit)
  return (
    <Page area="staff" gap={20}>
      <Head
        eyebrow={t('staff.patients.eyebrow', { facility: facility?.shortName ?? '', unit })}
        canPrint={rows.length > 0}
        onPrint={print}
      />
      <div className={styles.bar}>
        <SegmentedControl<Scope>
          label={t('staff.patients.scope')}
          value={scope}
          onChange={setScope}
          inline
          options={[
            { value: 'mine', label: `${t('staff.patients.scopes.mine')} ${String(mineCount)}` },
            { value: 'ward', label: `${t('staff.patients.scopes.ward')} ${String(all.length)}` },
          ]}
        />
      </div>
      {patients.isError ? (
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={() => void patients.refetch()}>
              {t('staff.patients.retry')}
            </Button>
          }
        >
          {t('staff.patients.loadFailed')}
        </Banner>
      ) : null}
      <ListCard q={patients} rows={rows} now={clock.now()} timeZone={timeZone} />
    </Page>
  )
}

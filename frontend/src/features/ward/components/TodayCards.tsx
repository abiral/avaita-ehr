import { Link } from 'react-router'
import type { StaffToday } from '@/application/ports'
import { paths } from '@/app/routes'
import type { PatientListItem } from '@/domain/clinical'
import { formatTime, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Table, Tag } from '@/ui'
import styles from '../Ward.module.css'
import { bedNumber } from '../model/patientRows'
import { PatientCell } from './PatientCell'

type Attention = StaffToday['attention'][number]

const targetOf = (a: Attention): string => {
  if (a.target.type === 'result') return paths.staff.result(a.target.id)
  if (a.target.type === 'note') return `${paths.staff.notes(a.target.patientId)}?note=${a.target.id}`
  return paths.staff.chart(a.target.patientId)
}

export function Stats({ today, mine }: { readonly today: StaffToday; readonly mine: number }) {
  const critical = today.attention.filter((a) => a.kind === 'critical-result').length
  const items = [
    { label: t('staff.today.myPatients'), value: mine, to: paths.staff.patients, danger: false },
    { label: t('staff.today.critical'), value: critical, to: paths.staff.results, danger: critical > 0 },
    { label: t('staff.today.notesToSign'), value: today.notesToSign, to: paths.staff.patients, danger: false },
    { label: t('staff.today.discharges'), value: today.plannedDischarges, to: paths.staff.patients, danger: false },
  ]
  return (
    <ul className={styles.stats} aria-label={t('staff.today.stats')}>
      {items.map((s) => (
        <li key={s.label}>
          <Link to={s.to} className={styles.stat}>
            <span className={styles.statLabel}>{s.label}</span>{' '}
            <span className={cx(styles.statValue, s.danger && styles.danger)}>{s.value}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function MyPatients({
  patients,
  now,
  timeZone,
}: {
  readonly patients: readonly PatientListItem[]
  readonly now: Date
  readonly timeZone: string
}) {
  return (
    <Card as="section" labelledBy="my-patients" className={styles.wide}>
      <div className={styles.cardHead}>
        <h2 id="my-patients" className={styles.cardTitle}>
          {t('staff.today.mine')}
        </h2>
        <Link to={paths.staff.patients} className={styles.small}>
          {t('staff.today.wardList')}
        </Link>
      </div>
      {patients.length === 0 ? <p className={styles.empty}>{t('staff.today.noPatients')}</p> : null}
      <Table
        caption={t('staff.today.mine')}
        rows={patients}
        rowKey={(p) => p.id}
        columns={[
          {
            key: 'bed',
            header: t('staff.patients.columns.bed'),
            width: '44px',
            cell: (p) => <span className={styles.bed}>{bedNumber(p.bed)}</span>,
          },
          {
            key: 'patient',
            header: t('staff.patients.columns.patient'),
            cell: (p) => <PatientCell p={p} now={now} timeZone={timeZone} />,
          },
          { key: 'reason', header: t('staff.patients.columns.reason'), cell: (p) => p.diagnosis },
          {
            key: 'next',
            header: t('staff.patients.columns.next'),
            width: '150px',
            cell: (p) => <Tag tone={p.nextTone}>{p.next}</Tag>,
          },
          {
            key: 'seen',
            header: t('staff.patients.columns.seen'),
            width: '56px',
            align: 'right',
            cell: (p) => <span className={styles.time}>{p.seenAt ? formatTime(p.seenAt, timeZone) : ''}</span>,
          },
        ]}
      />
    </Card>
  )
}

export function NeedsAttention({ items }: { readonly items: readonly Attention[] }) {
  return (
    <Card as="section" labelledBy="attention" className={styles.clip}>
      <div className={styles.cardHead}>
        <h2 id="attention" className={styles.cardTitle}>
          {t('staff.today.attention')}
        </h2>
        <span className={styles.count}>{items.length}</span>
      </div>
      {items.length === 0 ? <p className={styles.empty}>{t('staff.today.nothing')}</p> : null}
      <ul className={styles.list}>
        {items.map((a) => {
          const critical = a.kind === 'critical-result'
          return (
            <li key={`${a.kind}-${a.target.id}`}>
              <Link to={targetOf(a)} className={styles.att}>
                <span className={cx(styles.dot, critical && styles.dotCritical)} aria-hidden="true" />
                <span className={styles.attText}>
                  <span className={cx(styles.attKind, critical && styles.attKindCritical)}>
                    {t(`staff.today.attentionKind.${a.kind}`)}
                  </span>
                  <span className={styles.strong}>{a.title}</span>
                  <span className={styles.muted}>
                    {a.patientName} · {a.context}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function Agenda({ items, timeZone }: { readonly items: StaffToday['agenda']; readonly timeZone: string }) {
  return (
    <Card as="section" labelledBy="agenda" className={styles.agendaCard}>
      <div className={styles.agendaHead}>
        <h2 id="agenda" className={styles.cardTitle}>
          {t('staff.today.agenda')}
        </h2>
        <Link to={paths.staff.schedule} className={styles.small}>
          {t('staff.today.schedule')}
        </Link>
      </div>
      {items.length === 0 ? <p className={styles.muted}>{t('staff.today.noAgenda')}</p> : null}
      <ol className={styles.agenda}>
        {items.map((e) => (
          <li key={`${e.at.toISOString()}-${e.what}`} className={styles.agendaItem}>
            <span className={styles.time}>{formatTime(e.at, timeZone)}</span>
            <span>{e.what}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useSession } from '@/app/session/SessionProvider'
import { sessionOf } from '@/app/session/sessionState'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { PatientReport } from '@/domain/labs'
import { formatDate, formatLabValue, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Banner, Button, Card, EmptyState, Page, SkeletonRows, Tag } from '@/ui'
import { ReportDetail } from './components/ReportDetail'
import { flagSummary, reportRows } from './model/reportRows'
import styles from './Reports.module.css'

function ReportList({
  reports,
  openId,
  timeZone,
  onOpen,
}: {
  readonly reports: readonly PatientReport[]
  readonly openId: string | undefined
  readonly timeZone: string
  readonly onOpen: (id: string) => void
}) {
  return (
    <Card className={styles.nav}>
      <nav aria-label={t('portal.reports.list')}>
        <div className={cx('cap', styles.navCap)}>{t('portal.reports.all')}</div>
        <ul className={styles.list}>
          {reports.map((r) => (
            <li key={r.id}>
              <button type="button" className={styles.rep} aria-pressed={r.id === openId} onClick={() => onOpen(r.id)}>
                <span className={styles.repRow}>
                  <span className={styles.repName}>{r.panel}</span>
                  {r.isNew ? <Tag tone="info">{t('portal.reports.new')}</Tag> : null}
                </span>
                <span className={styles.muted}>
                  {t('portal.reports.meta', { date: formatDate(r.collectedAt, timeZone), flags: flagSummary(r) })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  )
}

function usePrintReport() {
  const { printer } = useServices()
  const session = sessionOf(useSession().state)
  return (r: PatientReport) => {
    if (session?.kind !== 'patient') return
    const lines = reportRows(r).map(
      (row) =>
        `${row.name}: ${formatLabValue(row.numeric)} ${row.unit} (${row.rangeText}) ${t(`portal.reports.flag.${row.flag}`)}`,
    )
    printer.print({
      title: r.panel,
      patientName: session.displayName,
      mrn: session.mrn,
      printedBy: session.displayName,
      sections: [{ heading: r.panel, lines: r.comment ? [...lines, r.comment] : lines }],
    })
  }
}

/** P8: released lab reports with range bars, flags in words and the doctor's comment. */
export function ReportsScreen() {
  const { repos } = useServices()
  const keys = useKeys()
  const { timeZone } = useTenant()
  const print = usePrintReport()
  const reports = useQuery({ queryKey: keys.myReports, queryFn: ({ signal }) => repos.labs.myReports(signal) })
  const [openId, setOpenId] = useState<string | null>(null)
  const list = reports.data ?? []
  const open = list.find((r) => r.id === openId) ?? list[0]
  return (
    <Page area="portal" gap={24}>
      <h1 className={styles.title}>{t('portal.reports.title')}</h1>
      {reports.isPending ? (
        <Card>
          <SkeletonRows label={t('portal.reports.loading')} rows={4} />
        </Card>
      ) : null}
      {reports.isError ? (
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={() => void reports.refetch()}>
              {t('portal.reports.retry')}
            </Button>
          }
        >
          {t('portal.reports.loadFailed')}
        </Banner>
      ) : null}
      {reports.isSuccess && list.length === 0 ? (
        <Card>
          <EmptyState title={t('portal.reports.none')} body={t('portal.reports.noneBody')} />
        </Card>
      ) : null}
      {open ? (
        <div className={styles.layout}>
          <ReportList reports={list} openId={open.id} timeZone={timeZone} onOpen={setOpenId} />
          <ReportDetail report={open} timeZone={timeZone} onPrint={() => print(open)} />
        </div>
      ) : null}
    </Page>
  )
}

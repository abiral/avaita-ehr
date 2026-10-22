import type { PatientReport } from '@/domain/labs'
import { formatDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, IconButton, RangeBar, Tag } from '@/ui'
import styles from '../Reports.module.css'
import { reportRows } from '../model/reportRows'

export interface ReportDetailProps {
  readonly report: PatientReport
  readonly timeZone: string
  readonly onPrint: () => void
}

function ReportTable({ report }: { readonly report: PatientReport }) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr className="cap">
            <th scope="col">{t('portal.reports.columns.test')}</th>
            <th scope="col">{t('portal.reports.columns.result')}</th>
            <th scope="col">{t('portal.reports.columns.range')}</th>
            <th scope="col">{t('portal.reports.columns.flag')}</th>
          </tr>
        </thead>
        <tbody>
          {reportRows(report).map((row) => (
            <tr key={row.name}>
              <th scope="row" className={styles.testName}>
                {row.name}
              </th>
              <td>
                <span className={cx(styles.value, row.flag !== 'normal' && styles.out)}>{row.value}</span>
                <span className={styles.unit}>{row.unit}</span>
              </td>
              <td>
                <RangeBar
                  value={row.numeric}
                  low={row.bounds.low}
                  high={row.bounds.high}
                  label={row.aria}
                  rangeText={row.rangeText}
                />
              </td>
              <td>
                <Tag tone={row.flag === 'normal' ? 'neutral' : 'alert'}>{t(`portal.reports.flag.${row.flag}`)}</Tag>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** One released report: the doctor's note, then each value with its range bar and flag in words. */
export function ReportDetail({ report, timeZone, onPrint }: ReportDetailProps) {
  return (
    <Card as="article" className={styles.detail} labelledBy="report-title">
      <div className={styles.detailHead}>
        <div className={styles.stack}>
          <h2 id="report-title" className={styles.detailTitle}>
            {report.panel}
          </h2>
          <span className={styles.muted}>{formatDate(report.collectedAt, timeZone)}</span>
        </div>
        <IconButton icon="printer" outlined label={t('portal.reports.print')} onClick={onPrint} />
      </div>
      {report.comment ? (
        <div className={styles.comment}>
          <span className={styles.commentFrom}>
            {t('portal.reports.noteFrom', { doctor: report.reviewedBy ?? report.orderedBy })}
          </span>
          <span className={styles.commentText}>{report.comment}</span>
        </div>
      ) : null}
      <ReportTable report={report} />
      <p className={styles.footer}>{t('portal.reports.footer')}</p>
    </Card>
  )
}

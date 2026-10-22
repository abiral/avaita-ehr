import { isAbnormal, labFlag, type LabResult } from '@/domain/labs'
import { formatLabValue, formatShortDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Tag } from '@/ui'
import styles from '../Results.module.css'
import { rangeText } from '../model/trend'

const PREVIOUS = 3

/** Every analyte with its flag in words, range and up to three previous values. */
export function ResultTable({ result, timeZone }: { readonly result: LabResult; readonly timeZone: string }) {
  const dates = (result.analytes[0]?.history ?? []).slice(-PREVIOUS)
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr className="cap">
            <th scope="col">{t('clinical.results.columns.test')}</th>
            <th scope="col">{t('clinical.results.columns.result')}</th>
            <th scope="col">{t('clinical.results.columns.range')}</th>
            {dates.map((d) => (
              <th key={d.at.toISOString()} scope="col" className={styles.num}>
                {formatShortDate(d.at, timeZone)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.analytes.map((a) => {
            const flag = labFlag(a.value, a.range)
            const previous = a.history.slice(-PREVIOUS)
            return (
              <tr key={a.code}>
                <th scope="row" className={styles.testName}>
                  {a.name}
                </th>
                <td>
                  <span className={styles.value}>
                    <span className={cx(styles.valueText, isAbnormal(flag) && styles.abnormal)}>
                      {formatLabValue(a.value)}
                    </span>
                    {isAbnormal(flag) ? (
                      <Tag tone={flag.startsWith('critical') ? 'critical' : 'alert'}>{t(`clinical.flags.${flag}`)}</Tag>
                    ) : null}
                  </span>
                </td>
                <td className={styles.dim}>
                  {rangeText(a.range)} {a.unit}
                </td>
                {dates.map((d, i) => (
                  <td key={d.at.toISOString()} className={cx(styles.dim, styles.num)}>
                    {previous[i] ? formatLabValue(previous[i].value) : ''}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

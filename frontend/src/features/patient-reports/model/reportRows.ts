import { barBounds, labFlag, type PatientReport } from '@/domain/labs'
import { formatLabValue, t } from '@/i18n'
import { rangeText } from '@/features/results-review'

export type PatientFlag = 'high' | 'low' | 'normal'

/** Patients see High, Low or Normal; critical values read as High or Low with the doctor's comment. */
export const patientFlag = (value: number, range: PatientReport['analytes'][number]['range']): PatientFlag => {
  const f = labFlag(value, range)
  if (f === 'high' || f === 'critical-high') return 'high'
  if (f === 'low' || f === 'critical-low') return 'low'
  return 'normal'
}

export interface ReportRow {
  readonly name: string
  readonly value: string
  readonly unit: string
  readonly numeric: number
  readonly flag: PatientFlag
  readonly bounds: { readonly low: number; readonly high: number }
  readonly rangeText: string
  readonly aria: string
}

export function reportRows(report: PatientReport): ReportRow[] {
  return report.analytes.map((a) => {
    const flag = patientFlag(a.value, a.range)
    const value = formatLabValue(a.value)
    return {
      name: a.name,
      value,
      unit: a.unit,
      numeric: a.value,
      flag,
      bounds: barBounds(a.range),
      rangeText: `${rangeText(a.range)} ${a.unit}`,
      aria: t('portal.reports.rangeAria', {
        test: a.name,
        value,
        unit: a.unit,
        flag: t(`portal.reports.flag.${flag}`).toLowerCase(),
      }),
    }
  })
}

export function flagSummary(report: PatientReport): string {
  const out = reportRows(report).filter((r) => r.flag !== 'normal').length
  if (out === 0) return t('portal.reports.allIn')
  return out === 1 ? t('portal.reports.outsideOne') : t('portal.reports.outside', { count: out })
}

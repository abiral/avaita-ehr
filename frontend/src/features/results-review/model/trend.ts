import {
  barBounds,
  isAbnormal,
  labFlag,
  rangeShape,
  type Analyte,
  type InboxItem,
  type LabFlag,
  type ReferenceRange,
} from '@/domain/labs'
import { formatLabValue, formatShortDate, t } from '@/i18n'

const TICKS = 4

const round = (n: number, span: number): number => (span >= 10 ? Math.round(n) : Math.round(n * 10) / 10)

export function rangeText(range: ReferenceRange): string {
  const s = rangeShape(range)
  if (s.kind === 'between')
    return t('clinical.results.range.between', { low: formatLabValue(s.low), high: formatLabValue(s.high) })
  if (s.kind === 'above') return t('clinical.results.range.above', { low: formatLabValue(s.low) })
  if (s.kind === 'below') return t('clinical.results.range.below', { high: formatLabValue(s.high) })
  return t('clinical.results.range.none')
}

/** The analyte to chart: the most severe flag first, then the first in the panel. */
export function focusAnalyte(analytes: readonly Analyte[]): Analyte | undefined {
  const rank = (a: Analyte) => {
    const f = labFlag(a.value, a.range)
    return f.startsWith('critical') ? 2 : isAbnormal(f) ? 1 : 0
  }
  return [...analytes].sort((a, b) => rank(b) - rank(a))[0]
}

/** "Potassium rising from 4.9 on 17 Oct to 6.1 on 20 Oct": the chart's text alternative. */
function trendSummary(name: string, points: readonly { label: string; value: number }[]): string {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return name
  const direction = first.value === last.value ? 'flat' : last.value > first.value ? 'up' : 'down'
  return t('clinical.results.trendSummary', {
    analyte: name,
    direction: t(`clinical.results.direction.${direction}`),
    first: formatLabValue(first.value),
    firstDate: first.label,
    last: formatLabValue(last.value),
    lastDate: last.label,
  })
}

/** TrendChart props for one analyte: history plus the current value, with the normal band shaded. */
export function trendOf(a: Analyte, reportedAt: Date, timeZone: string) {
  const series = [...a.history, { at: reportedAt, value: a.value }]
  const band = barBounds(a.range)
  const values = series.map((p) => p.value)
  const lo = Math.min(...values, band.low)
  const hi = Math.max(...values, band.high)
  const span = hi - lo || 1
  const ticks = Array.from({ length: TICKS }, (_, i) => round(lo + (span * i) / (TICKS - 1), span))
  const points = series.map((p) => {
    const flag = labFlag(p.value, a.range)
    const label = formatShortDate(p.at, timeZone)
    return {
      label,
      value: p.value,
      outOfRange: isAbnormal(flag),
      description: `${label}: ${formatLabValue(p.value)} ${a.unit}, ${t(`clinical.flags.${flag}`).toLowerCase()}`,
    }
  })
  return {
    title: t('clinical.results.trendTitle', { analyte: a.name, count: series.length }),
    note: t('clinical.results.trendNote', { range: `${rangeText(a.range)} ${a.unit}` }),
    summary: trendSummary(a.name, points),
    points,
    band,
    domain: { min: lo - span * 0.15, max: hi + span * 0.1 },
    ticks,
  }
}

export type InboxTone = 'critical' | 'alert' | 'neutral' | 'info'

/** Inbox tag: never color alone, always a word. */
export function inboxTag(item: Pick<InboxItem, 'worstFlag' | 'preliminary' | 'review'>): {
  tone: InboxTone
  text: string
} {
  if (item.review === 'acknowledged') return { tone: 'info', text: t('clinical.flags.reviewed') }
  if (item.worstFlag.startsWith('critical')) return { tone: 'critical', text: t(`clinical.flags.${item.worstFlag}`) }
  if (item.preliminary) return { tone: 'neutral', text: t('clinical.flags.preliminary') }
  return isAbnormal(item.worstFlag)
    ? { tone: 'alert', text: t('clinical.flags.abnormal') }
    : { tone: 'neutral', text: t('clinical.flags.normal') }
}

const severity = (f: LabFlag): number => (f.startsWith('critical') ? 2 : isAbnormal(f) ? 1 : 0)

/** Unreviewed first, most severe first, then oldest report first. */
export const sortInbox = (items: readonly InboxItem[]): InboxItem[] =>
  [...items].sort(
    (a, b) =>
      Number(a.review === 'acknowledged') - Number(b.review === 'acknowledged') ||
      severity(b.worstFlag) - severity(a.worstFlag) ||
      a.reportedAt.getTime() - b.reportedAt.getTime(),
  )

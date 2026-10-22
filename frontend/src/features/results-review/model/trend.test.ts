import type { LabResultId } from '@/core/branded'
import type { Analyte, InboxItem } from '@/domain/labs'
import { focusAnalyte, inboxTag, rangeText, sortInbox, trendOf } from './trend'

const TZ = 'Asia/Kathmandu'
const k: Analyte = {
  code: 'K',
  name: 'Potassium',
  value: 6.1,
  unit: 'mmol/L',
  range: { low: 3.5, high: 5.1, criticalLow: 2.8, criticalHigh: 6 },
  history: [
    { at: new Date('2026-10-17T00:00:00Z'), value: 4.9 },
    { at: new Date('2026-10-18T00:00:00Z'), value: 5.2 },
  ],
}
const na: Analyte = {
  ...k,
  code: 'NA',
  name: 'Sodium',
  value: 136,
  range: { low: 135, high: 145, criticalLow: null, criticalHigh: null },
}

describe('results review model', () => {
  it('charts the most severe analyte with history and a text summary', () => {
    expect(focusAnalyte([na, k])?.code).toBe('K')
    const trend = trendOf(k, new Date('2026-10-20T00:25:00Z'), TZ)
    expect(trend.title).toBe('Potassium, last 3 results')
    expect(trend.summary).toBe('Potassium rising from 4.9 on 17 Oct to 6.1 on 20 Oct')
    expect(trend.points.map((p) => p.description)).toEqual([
      '17 Oct: 4.9 mmol/L, normal',
      '18 Oct: 5.2 mmol/L, high',
      '20 Oct: 6.1 mmol/L, critical',
    ])
    expect(trend.band).toEqual({ low: 3.5, high: 5.1 })
  })

  it('writes ranges in words', () => {
    expect(rangeText(k.range)).toBe('3.5 to 5.1')
    expect(rangeText({ low: 60, high: null, criticalLow: null, criticalHigh: null })).toBe('Above 60')
  })

  it('tags and sorts the inbox', () => {
    const item = (
      id: string,
      worstFlag: InboxItem['worstFlag'],
      review: InboxItem['review'],
      minutes: number,
    ): InboxItem => ({
      id: id as LabResultId,
      patientName: id,
      panel: 'p',
      reportedAt: new Date(minutes * 60_000),
      worstFlag,
      preliminary: false,
      review,
    })
    const sorted = sortInbox([
      item('a', 'normal', 'unreviewed', 1),
      item('b', 'critical-high', 'unreviewed', 5),
      item('c', 'high', 'acknowledged', 0),
    ])
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'c'])
    expect(inboxTag(sorted[0] ?? item('x', 'normal', 'unreviewed', 0))).toEqual({ tone: 'critical', text: 'Critical' })
    expect(inboxTag({ worstFlag: 'high', preliminary: false, review: 'unreviewed' })).toEqual({
      tone: 'alert',
      text: 'Abnormal',
    })
  })
})

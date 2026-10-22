import type { Analyte, RecentCollection } from './types'
import { duplicateWarnings, labResultReview } from './review'

const potassium = (value: number): Analyte => ({
  code: 'K',
  name: 'Potassium',
  value,
  unit: 'mmol/L',
  range: { low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6.0 },
  history: [],
})

describe('labResultReview', () => {
  const critical = { analytes: [potassium(6.3)], review: 'unreviewed' as const, releasedToPatient: false }
  const high = { analytes: [potassium(5.4)], review: 'unreviewed' as const, releasedToPatient: false }

  it('acknowledges once', () => {
    expect(labResultReview(critical, 'acknowledge')).toEqual({
      ok: true,
      value: { review: 'acknowledged', releasedToPatient: false },
    })
    expect(labResultReview({ ...critical, review: 'acknowledged' }, 'acknowledge')).toEqual({
      ok: false,
      error: 'already-acknowledged',
    })
  })

  it('releases a critical result only after acknowledgement', () => {
    expect(labResultReview(critical, 'release')).toEqual({ ok: false, error: 'acknowledge-critical-first' })
    expect(labResultReview({ ...critical, review: 'acknowledged' }, 'release').ok).toBe(true)
  })

  it('releases a non-critical result independently of review, once', () => {
    expect(labResultReview(high, 'release')).toEqual({
      ok: true,
      value: { review: 'unreviewed', releasedToPatient: true },
    })
    expect(labResultReview({ ...high, releasedToPatient: true }, 'release')).toEqual({
      ok: false,
      error: 'already-released',
    })
  })
})

describe('duplicateWarnings', () => {
  const now = new Date('2026-10-20T03:45:00Z')
  const recent: RecentCollection[] = [
    { testCode: 'RFP', collectedAt: new Date('2026-10-20T00:25:00Z') },
    { testCode: 'CBC', collectedAt: new Date('2026-10-18T00:25:00Z') },
  ]
  it('flags tests in the basket collected in the last 24 hours', () => {
    const found = duplicateWarnings(['RFP', 'CBC', 'K'], recent, now)
    expect([...found.keys()]).toEqual(['RFP'])
  })
})

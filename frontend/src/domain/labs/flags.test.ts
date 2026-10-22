import { barBounds, flagLetter, isAbnormal, isCritical, labFlag, rangeShape, worstFlag } from './flags'

const K = { low: 3.5, high: 5.1, criticalLow: 2.8, criticalHigh: 6.0 }

describe('labFlagRules', () => {
  it.each([
    [6.1, 'critical-high'],
    [6.0, 'critical-high'],
    [5.3, 'high'],
    [4.2, 'normal'],
    [3.4, 'low'],
    [2.8, 'critical-low'],
  ] as const)('potassium %f is %s', (value, flag) => {
    expect(labFlag(value, K)).toBe(flag)
  })

  it('handles open ranges', () => {
    expect(labFlag(42, { low: 60, high: null, criticalLow: null, criticalHigh: null })).toBe('low')
    expect(labFlag(4.6, { low: null, high: 5.2, criticalLow: null, criticalHigh: null })).toBe('normal')
    expect(rangeShape({ low: 60, high: null, criticalLow: null, criticalHigh: null })).toEqual({
      kind: 'above',
      low: 60,
    })
    expect(rangeShape({ low: null, high: 5.2, criticalLow: null, criticalHigh: null })).toEqual({
      kind: 'below',
      high: 5.2,
    })
    expect(rangeShape({ low: null, high: null, criticalLow: null, criticalHigh: null })).toEqual({ kind: 'none' })
    expect(barBounds({ low: 60, high: null, criticalLow: null, criticalHigh: null })).toEqual({ low: 60, high: 120 })
    expect(barBounds({ low: null, high: 5.2, criticalLow: null, criticalHigh: null })).toEqual({ low: 0, high: 5.2 })
    expect(barBounds({ low: null, high: null, criticalLow: null, criticalHigh: null })).toEqual({ low: 0, high: 1 })
    expect(barBounds(K)).toEqual({ low: 3.5, high: 5.1 })
  })

  it('picks the worst flag and the letter', () => {
    expect(worstFlag(['normal', 'low', 'critical-high', 'high'])).toBe('critical-high')
    expect(worstFlag([])).toBe('normal')
    expect(flagLetter('critical-low')).toBe('L')
    expect(flagLetter('high')).toBe('H')
    expect(flagLetter('normal')).toBe('')
    expect(isCritical('critical-low')).toBe(true)
    expect(isAbnormal('normal')).toBe(false)
  })
})

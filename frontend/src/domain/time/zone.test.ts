import {
  addDaysIn,
  addLocalDays,
  ageOn,
  atLocal,
  daysBetween,
  localDateOf,
  localTimeOf,
  minutesOf,
  overlaps,
  startOfDayIn,
  timeOf,
  weekdayOf,
  weekdayOfLocal,
  zonedParts,
} from './zone'

const KTM = 'Asia/Kathmandu'
const NY = 'America/New_York'

describe('facility time zone helpers', () => {
  it('handles the UTC+5:45 offset', () => {
    const d = atLocal('2026-11-03', '09:30', KTM)
    expect(d.toISOString()).toBe('2026-11-03T03:45:00.000Z')
    expect(localTimeOf(d, KTM)).toBe('09:30')
    expect(weekdayOf(d, KTM)).toBe(2)
    expect(zonedParts(d, KTM)).toMatchObject({ year: 2026, month: 11, day: 3, hour: 9, minute: 30 })
  })

  it('finds the facility day boundary, not the UTC one', () => {
    // 18:20 UTC on 2 Nov is already 3 Nov 00:05 in Kathmandu.
    const late = new Date('2026-11-02T18:20:00Z')
    expect(localDateOf(late, KTM)).toBe('2026-11-03')
    expect(localDateOf(late, 'UTC')).toBe('2026-11-02')
    expect(startOfDayIn(late, KTM).toISOString()).toBe('2026-11-02T18:15:00.000Z')
    expect(weekdayOf(new Date('2026-10-25T18:14:00Z'), KTM)).toBe(7)
    expect(weekdayOf(new Date('2026-10-25T18:15:00Z'), KTM)).toBe(1)
  })

  it('keeps wall-clock time across a DST change', () => {
    const before = atLocal('2026-03-07', '09:00', NY)
    const after = addDaysIn(before, 1, NY)
    expect(localTimeOf(after, NY)).toBe('09:00')
    expect(after.getTime() - before.getTime()).toBe(23 * 3_600_000)
    expect(atLocal('2026-11-01', '09:00', NY).toISOString()).toBe('2026-11-01T14:00:00.000Z')
    expect(atLocal('2026-10-31', '09:00', NY).toISOString()).toBe('2026-10-31T13:00:00.000Z')
  })

  it('works with plain calendar dates and times', () => {
    expect(minutesOf('09:20')).toBe(560)
    expect(timeOf(560)).toBe('09:20')
    expect(addLocalDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(daysBetween('2026-10-20', '2026-11-03')).toBe(14)
    expect(weekdayOfLocal('2026-10-25')).toBe(7)
    expect(weekdayOfLocal('2026-10-26')).toBe(1)
    expect(ageOn('1965-03-12', '2026-10-20')).toBe(61)
    expect(ageOn('1958-11-14', '2026-10-20')).toBe(67)
  })

  it('detects overlapping ranges', () => {
    const t = (h: number) => new Date(Date.UTC(2026, 9, 20, h))
    expect(overlaps(t(1), t(3), t(2), t(4))).toBe(true)
    expect(overlaps(t(1), t(2), t(2), t(3))).toBe(false)
  })
})

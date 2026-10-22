import type { PractitionerId, TimeOffId } from '@/core/branded'
import type { TimeOff } from '@/domain/scheduling/types'
import { atLocal } from '@/domain/time'
import { addMonths, lastDayOf, monthCells, monthStart, upcoming } from './calendar'

const KTM = 'Asia/Kathmandu'
const off = (
  id: string,
  kind: TimeOff['kind'],
  start: Date,
  end: Date,
  name: string,
  reason: TimeOff['reason'],
): TimeOff => ({
  id: id as TimeOffId,
  practitionerId: 'p' as PractitionerId,
  practitionerName: name,
  kind,
  start,
  end,
  reason,
  patientNote: '',
  handling: 'notify',
  coverPractitionerId: null,
  affectedCount: 0,
  impactNote: '',
})
const pk = off(
  'a',
  'full',
  atLocal('2026-10-26', '00:00', KTM),
  atLocal('2026-10-29', '00:00', KTM),
  'Dr. Prakash Karki',
  'conference',
)
const ra = off(
  'b',
  'part',
  atLocal('2026-10-22', '14:00', KTM),
  atLocal('2026-10-22', '16:00', KTM),
  'Dr. Rohan Adhikari',
  'meeting',
)

describe('A2 calendar model', () => {
  it('lays out October 2026 from Monday with marks in Kathmandu time', () => {
    const cells = monthCells('2026-10-01', [pk, ra], '2026-10-21', KTM)
    expect(cells).toHaveLength(35)
    expect(cells.slice(0, 3).every((c) => c.day === '')).toBe(true)
    expect(cells[3]?.day).toBe('1')
    const byDay = (d: string) => cells.find((c) => c.day === d)
    expect(byDay('22')?.marks).toEqual([
      { label: 'RA 14:00 to 16:00', full: 'Dr. Rohan Adhikari · meeting', tone: 'part' },
    ])
    expect(byDay('26')?.marks[0]).toMatchObject({ label: 'PK Conference', tone: 'leave' })
    expect(byDay('28')?.marks).toHaveLength(1)
    expect(byDay('29')?.marks).toHaveLength(0)
    expect(byDay('21')?.today).toBe(true)
    expect(byDay('24')?.weekend).toBe(true)
  })

  it('moves months and lists upcoming entries', () => {
    expect(monthStart('2026-10-21')).toBe('2026-10-01')
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01')
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
    expect(upcoming([pk, ra], atLocal('2026-10-23', '00:00', KTM))).toEqual([pk])
    expect(lastDayOf(pk, KTM)).toBe('2026-10-28')
  })
})

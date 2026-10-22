import type { Appointment } from '@/domain/appointments'
import type { TimeOff } from '@/domain/scheduling/types'
import { columnItems, hourLabels, nowRow, rowAt, ROWS } from './grid'
import { shiftWeek, workWeek } from './week'

const TZ = 'Asia/Kathmandu'
const at = (time: string, date = '2026-10-20') => new Date(`${date}T${time}:00+05:45`)

const appt = (id: string, time: string, status: Appointment['status'], minutes = 30): Appointment =>
  ({
    id,
    patientId: `pt_${id}`,
    patientName: `Patient ${id}`,
    start: at(time),
    end: new Date(at(time).getTime() + minutes * 60_000),
    status,
    mode: 'onsite',
    cancelledBy: status === 'cancelled' ? 'patient' : null,
  }) as Appointment

const block = (kind: TimeOff['kind'], start: Date, end: Date): TimeOff =>
  ({ id: `to_${kind}`, kind, start, end, impactNote: 'Admin time' }) as TimeOff

const input = (appointments: Appointment[], timeOff: TimeOff[] = []) => ({
  appointments,
  timeOff,
  date: '2026-10-20',
  timeZone: TZ,
  describe: (a: Appointment) => a.status,
  labels: { blocked: 'Blocked', onLeave: 'On leave' },
})

describe('clinic schedule grid', () => {
  it('places items on ten-minute rows within 08:00 to 17:00', () => {
    expect(ROWS).toBe(54)
    expect(rowAt(at('08:00'), '2026-10-20', TZ)).toBe(1)
    expect(rowAt(at('09:40'), '2026-10-20', TZ)).toBe(11)
    expect(rowAt(at('07:00'), '2026-10-20', TZ)).toBe(1)
    expect(rowAt(at('18:00'), '2026-10-20', TZ)).toBe(55)
    expect(hourLabels()[1]).toEqual({ time: '09:00', row: 7 })
  })

  it('maps status to look and tag, hiding a cancelled slot that was rebooked', () => {
    const items = columnItems(
      input([
        appt('a', '10:00', 'completed'),
        appt('b', '14:00', 'arrived'),
        appt('c', '15:30', 'cancelled'),
        appt('d', '16:00', 'cancelled'),
        appt('e', '16:00', 'booked', 20),
      ]),
    )
    expect(items.map((i) => [i.id, i.look, i.tag, i.span])).toEqual([
      ['a', 'done', 'seen', 3],
      ['b', 'booked', 'arrived', 3],
      ['c', 'cancelled', null, 3],
      ['e', 'booked', null, 2],
    ])
  })

  it('shows part-day blocks with their note and full-day leave across the day', () => {
    const part = columnItems(input([], [block('part', at('14:00'), at('15:00'))]))
    expect(part[0]).toMatchObject({ look: 'block', name: 'Admin time', what: 'Blocked', row: 37, span: 6 })
    const full = columnItems(input([], [block('full', at('00:00', '2026-10-19'), at('00:00', '2026-10-22'))]))
    expect(full[0]).toMatchObject({ name: 'On leave', row: 1, span: ROWS })
  })

  it('draws the current-time line only on today within clinic hours', () => {
    expect(nowRow(at('14:20'), '2026-10-20', TZ)).toBe(39)
    expect(nowRow(at('14:20'), '2026-10-21', TZ)).toBeNull()
    expect(nowRow(at('19:00'), '2026-10-20', TZ)).toBeNull()
  })

  it('builds the work week and pages by week', () => {
    expect(workWeek('2026-10-20')).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])
    expect(shiftWeek('2026-10-20', 1)).toBe('2026-10-27')
  })
})

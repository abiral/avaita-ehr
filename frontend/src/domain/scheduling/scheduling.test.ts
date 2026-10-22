import type { BlockId, PractitionerId, TimeOffId } from '@/core/branded'
import { atLocal } from '../time/zone'
import { blockAppliesOn, blockSlotCount, validateNewBlocks, weeklySummary } from './blocks'
import { checkSlot, dayStatus, slotsOn, templateSlots, type BookabilityInput } from './bookable'
import type { AvailabilityBlock, BlockMode, BookingRules, TimeOff, Weekday } from './types'

const KTM = 'Asia/Kathmandu'
const pk = 'pr_karki' as PractitionerId
const B = (
  weekday: Weekday,
  start: string,
  end: string,
  mode: BlockMode,
  repeat: AvailabilityBlock['repeat'] = 'weekly',
): AvailabilityBlock => ({
  id: `b_${weekday}_${start}` as BlockId,
  practitionerId: pk,
  weekday,
  start,
  end,
  slotMinutes: 20,
  mode,
  room: mode === 'remote' ? null : 'Room 5',
  repeat,
  effectiveFrom: '2026-10-05',
})
const blocks = [
  B(1, '09:00', '12:00', 'onsite'),
  B(1, '14:00', '16:00', 'remote'),
  B(2, '14:00', '17:00', 'remote'),
  B(3, '09:00', '12:00', 'onsite'),
  B(4, '09:00', '12:00', 'onsite'),
  B(4, '15:00', '17:00', 'remote'),
  B(5, '09:00', '11:00', 'onsite'),
  B(7, '10:00', '12:00', 'remote'),
]
const rules: BookingRules = { maxDaysAhead: 60, minNoticeMinutes: 120, cancelCutoffMinutes: 240, bufferMinutes: 0 }
const conference: TimeOff = {
  id: 'to_1' as TimeOffId,
  practitionerId: pk,
  practitionerName: 'Dr. Prakash Karki',
  kind: 'full',
  start: atLocal('2026-10-26', '00:00', KTM),
  end: atLocal('2026-10-29', '00:00', KTM),
  reason: 'conference',
  patientNote: '',
  handling: 'notify',
  coverPractitionerId: null,
  affectedCount: 0,
  impactNote: '',
}
const now = atLocal('2026-10-20', '08:30', KTM)
const base: Omit<BookabilityInput, 'start'> = {
  mode: 'onsite',
  blocks,
  timeOff: [conference],
  rules,
  practitioner: { offersOnsite: true, offersRemote: true },
  now,
  timeZone: KTM,
}
const at = (date: string, time: string) => atLocal(date, time, KTM)

describe('block rules (A1)', () => {
  it('counts slots per block and per week', () => {
    expect(blockSlotCount(B(1, '09:00', '12:00', 'onsite'))).toBe(9)
    expect(blockSlotCount({ start: '09:00', end: '09:10', slotMinutes: 20 })).toBe(0)
    expect(blockSlotCount({ start: '09:00', end: '12:00', slotMinutes: 20 }, 10)).toBe(6)
    expect(weeklySummary(blocks)).toEqual({ total: 60, onsite: 33, remote: 27, both: 0 })
    expect(weeklySummary([B(1, '09:00', '10:00', 'both'), B(2, '09:00', '10:00', 'onsite', 'once')]).both).toBe(3)
  })

  it('applies weekly, every-two-weeks and one-time blocks on the right dates', () => {
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite'), '2026-10-26')).toBe(true)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite'), '2026-09-28')).toBe(false)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite', 'biweekly'), '2026-10-12')).toBe(false)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite', 'biweekly'), '2026-10-19')).toBe(true)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite', 'once'), '2026-10-05')).toBe(true)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite', 'once'), '2026-10-12')).toBe(false)
    expect(blockAppliesOn(B(1, '09:00', '12:00', 'onsite'), '2026-10-27')).toBe(false)
  })

  it('validates new blocks: order, length and overlap', () => {
    expect(validateNewBlocks([], blocks)).toEqual({ kind: 'no-days' })
    expect(validateNewBlocks([{ weekday: 6, start: '12:00', end: '09:00', slotMinutes: 20 }], blocks)).toEqual({
      kind: 'end-before-start',
    })
    expect(validateNewBlocks([{ weekday: 6, start: '09:00', end: '09:10', slotMinutes: 20 }], blocks)).toEqual({
      kind: 'too-short',
      slotMinutes: 20,
    })
    expect(validateNewBlocks([{ weekday: 1, start: '11:00', end: '13:00', slotMinutes: 20 }], blocks)).toEqual({
      kind: 'overlap',
      weekday: 1,
      with: '09:00-12:00',
    })
    expect(validateNewBlocks([{ weekday: 1, start: '12:00', end: '13:00', slotMinutes: 20 }], blocks)).toBeNull()
  })
})

describe('checkSlot (P5)', () => {
  const check = (start: Date, extra: Partial<BookabilityInput> = {}) => checkSlot({ ...base, start, ...extra })
  it('accepts a slot inside a block in Kathmandu time', () => {
    expect(check(at('2026-10-21', '10:20'))).toEqual({ ok: true, value: true })
  })
  it.each([
    ['outside the template', at('2026-10-21', '12:20'), {}, 'outside-availability'],
    ['on a closed weekday', at('2026-10-24', '09:00'), {}, 'outside-availability'],
    ['not on the slot grid', at('2026-10-21', '10:10'), {}, 'outside-availability'],
    ['inside time off', at('2026-10-26', '09:00'), {}, 'on-leave'],
    ['before minimum notice', at('2026-10-20', '10:00'), { blocks: [B(2, '09:00', '12:00', 'onsite')] }, 'too-soon'],
    ['beyond the booking window', at('2026-12-23', '09:00'), {}, 'too-far'],
    ['already booked', at('2026-10-21', '10:20'), { taken: [at('2026-10-21', '10:20')] }, 'taken'],
    [
      'a mode the doctor does not offer',
      at('2026-10-21', '10:20'),
      { practitioner: { offersOnsite: false, offersRemote: true } },
      'mode-not-offered',
    ],
    ['a remote time for an on-site booking', at('2026-11-03', '14:00'), {}, 'outside-availability'],
  ])('rejects %s', (_, start, extra, kind) => {
    const r = check(start, extra)
    expect(r.ok ? null : r.error.kind).toBe(kind)
  })
  it('reports when the leave ends', () => {
    const r = check(at('2026-10-27', '15:00'), { mode: 'remote' })
    expect(r.ok ? null : r.error).toEqual({ kind: 'on-leave', until: conference.end })
  })
})

describe('dayStatus and slots (P5 date strip)', () => {
  it.each([
    ['2026-10-21', 'onsite', 'open', 9],
    ['2026-10-24', 'onsite', 'closed', 0],
    ['2026-10-26', 'onsite', 'on-leave', 0],
    ['2026-10-27', 'remote', 'on-leave', 0],
    ['2026-10-27', 'onsite', 'closed', 0],
    ['2027-01-04', 'onsite', 'closed', 0],
  ] as const)('%s %s is %s', (date, mode, status, free) => {
    expect(dayStatus(date, { ...base, mode })).toEqual({ status, free })
  })

  it('is full when every slot is taken', () => {
    const taken = templateSlots({ ...base, date: '2026-10-23', bufferMinutes: 0 }).map((s) => s.start)
    expect(dayStatus('2026-10-23', { ...base, taken })).toEqual({ status: 'full', free: 0 })
    expect(dayStatus('2026-10-23', { ...base, practitioner: { offersOnsite: false, offersRemote: true } }).status).toBe(
      'closed',
    )
  })

  it('marks taken and too-soon slots unavailable and handles a facility in a DST zone', () => {
    const slots = slotsOn('2026-10-21', { ...base, taken: [at('2026-10-21', '09:40')] })
    expect(slots.filter((s) => !s.available).map((s) => s.start)).toEqual([at('2026-10-21', '09:40')])
    const ny = 'America/New_York'
    const nySlots = slotsOn('2026-11-02', {
      ...base,
      timeOff: [],
      timeZone: ny,
      now: atLocal('2026-10-30', '09:00', ny),
    })
    expect(nySlots[0]?.start.toISOString()).toBe('2026-11-02T14:00:00.000Z')
    const beforeDst = slotsOn('2026-10-26', {
      ...base,
      timeOff: [],
      timeZone: ny,
      now: atLocal('2026-10-20', '09:00', ny),
    })
    expect(beforeDst[0]?.start.toISOString()).toBe('2026-10-26T13:00:00.000Z')
  })
})

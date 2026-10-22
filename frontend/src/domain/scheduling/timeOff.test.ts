import type { PractitionerId } from '@/core/branded'
import { draftProblem, toTimeOffRanges, type TimeOffDraft } from './timeOffRange'
import { initialTimeOffForm, timeOffForm, type TimeOffFormEvent, type TimeOffFormState } from './timeOffForm'

const impact = { affected: [], removedSlots: 22 }
const editing = initialTimeOffForm
const checking: TimeOffFormState = { status: 'checking' }
const previewing: TimeOffFormState = { status: 'previewing-impact', impact }
const saving: TimeOffFormState = { status: 'saving', impact }
const saved: TimeOffFormState = { status: 'saved', impact }

describe('timeOffForm transition table', () => {
  const rows: [TimeOffFormState, TimeOffFormEvent, TimeOffFormState][] = [
    [editing, { type: 'check' }, checking],
    [checking, { type: 'impact-loaded', impact }, previewing],
    [checking, { type: 'failed', error: 'x' }, { status: 'editing', error: 'x' }],
    [previewing, { type: 'back' }, editing],
    [previewing, { type: 'confirm' }, saving],
    [saving, { type: 'saved' }, saved],
    [saving, { type: 'failed', error: 'y' }, { status: 'editing', error: 'y' }],
    [saved, { type: 'again' }, editing],
    [editing, { type: 'confirm' }, editing],
    [editing, { type: 'saved' }, editing],
    [previewing, { type: 'check' }, previewing],
    [editing, { type: 'impact-loaded', impact }, editing],
    [editing, { type: 'failed', error: 'z' }, editing],
    [saving, { type: 'back' }, saving],
    [checking, { type: 'again' }, checking],
  ]
  it.each(rows)('%o + %o', (from, event, to) => {
    expect(timeOffForm(from, event)).toEqual(to)
  })
  it('rejects unknown events', () => {
    expect(() => timeOffForm(editing, { type: 'nope' } as never)).toThrow()
  })
})

describe('time-off ranges in the facility zone', () => {
  const draft: TimeOffDraft = {
    practitionerId: 'pr_sabina' as PractitionerId,
    kind: 'full',
    from: '2026-10-29',
    to: '2026-10-30',
    startTime: '13:00',
    endTime: '17:00',
    reason: 'personal',
    patientNote: '',
    handling: 'notify',
    coverPractitionerId: null,
  }
  it('covers whole Kathmandu days for full-day leave', () => {
    const [r] = toTimeOffRanges(draft, 'Asia/Kathmandu')
    expect(r?.start.toISOString()).toBe('2026-10-28T18:15:00.000Z')
    expect(r?.end.toISOString()).toBe('2026-10-30T18:15:00.000Z')
  })
  it('makes one window for part of a day and weekly windows for recurring', () => {
    expect(toTimeOffRanges({ ...draft, kind: 'part' }, 'Asia/Kathmandu').map((r) => r.start.toISOString())).toEqual([
      '2026-10-29T07:15:00.000Z',
    ])
    const weekly = toTimeOffRanges(
      { ...draft, kind: 'recurring', from: '2026-10-30', to: '2026-11-20' },
      'Asia/Kathmandu',
    )
    expect(weekly.map((r) => r.start.toISOString().slice(0, 10))).toEqual([
      '2026-10-30',
      '2026-11-06',
      '2026-11-13',
      '2026-11-20',
    ])
    expect(toTimeOffRanges({ ...draft, practitionerId: null }, 'Asia/Kathmandu')).toEqual([])
  })
  it('drops the cover doctor unless reassigning', () => {
    const [r] = toTimeOffRanges({ ...draft, coverPractitionerId: 'pr_anaya' as PractitionerId }, 'Asia/Kathmandu')
    expect(r?.coverPractitionerId).toBeNull()
  })
  it.each([
    [{ practitionerId: null }, 'no-doctor'],
    [{ to: '2026-10-28' }, 'end-before-start'],
    [{ kind: 'part', endTime: '12:00' }, 'end-before-start'],
    [{ handling: 'reassign' }, 'no-cover'],
    [{}, null],
  ] as const)('validates %o as %s', (patch, problem) => {
    expect(draftProblem({ ...draft, ...patch })).toBe(problem)
  })
})

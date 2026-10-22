import type { BlockId, PractitionerId, TimeOffId } from '@/core/branded'
import type { AvailabilityBlock, NewTimeOff, TimeOff } from '@/domain/scheduling/types'
import { createTimeOff, previewTimeOff, saveAvailabilityBlock, saveBookingRules } from './scheduling'

const pk = 'pr_karki' as PractitionerId
const block = {
  weekday: 1 as const,
  start: '09:00',
  end: '12:00',
  slotMinutes: 20,
  mode: 'onsite' as const,
  room: 'Room 5',
  repeat: 'weekly' as const,
  effectiveFrom: '2026-10-26',
}
const existing: AvailabilityBlock = { ...block, id: 'b1' as BlockId, practitionerId: pk }
const range: NewTimeOff = {
  practitionerId: pk,
  kind: 'full',
  start: new Date('2026-10-28T18:15:00Z'),
  end: new Date('2026-10-30T18:15:00Z'),
  reason: 'personal',
  patientNote: '',
  handling: 'notify',
  coverPractitionerId: null,
}
const saved = (r: NewTimeOff): TimeOff => ({
  ...r,
  id: 'to_1' as TimeOffId,
  practitionerName: 'Dr. Prakash Karki',
  affectedCount: 1,
  impactNote: '',
})

describe('scheduling use cases', () => {
  it('saves a valid block and rejects an overlap before calling the server', async () => {
    const saveBlocks = vi.fn(() => Promise.resolve([existing]))
    const run = saveAvailabilityBlock({ scheduling: { saveBlocks } })
    await expect(
      run({ practitionerId: pk, blocks: [{ ...block, weekday: 2 }], existing: [existing] }),
    ).resolves.toMatchObject({ value: [existing] })
    await expect(run({ practitionerId: pk, blocks: [block], existing: [existing] })).rejects.toMatchObject({
      code: 'validation_failed',
      fields: { blocks: 'overlap' },
    })
    expect(saveBlocks).toHaveBeenCalledTimes(1)
    saveBlocks.mockRejectedValueOnce(new Error('down'))
    await expect(run({ practitionerId: pk, blocks: [{ ...block, weekday: 3 }], existing: [] })).rejects.toThrow('down')
  })

  it('validates booking rules', async () => {
    const saveRules = vi.fn((r: unknown) => Promise.resolve(r as never))
    const rules = { maxDaysAhead: 60, minNoticeMinutes: 120, cancelCutoffMinutes: 240, bufferMinutes: 0 }
    await expect(saveBookingRules({ scheduling: { saveRules } })(rules)).resolves.toMatchObject({ value: rules })
    await expect(saveBookingRules({ scheduling: { saveRules } })({ ...rules, maxDaysAhead: 0 })).rejects.toMatchObject({
      code: 'validation_failed',
    })
    await expect(
      saveBookingRules({ scheduling: { saveRules } })({ ...rules, bufferMinutes: 2.5 }),
    ).rejects.toMatchObject({ code: 'validation_failed' })
  })

  it('sums the impact of several ranges in time order', async () => {
    const a = { appointmentId: 'a', patientName: 'Gita Shrestha', start: new Date('2026-10-30T03:15:00Z') }
    const b = { appointmentId: 'b', patientName: 'Prakash Lama', start: new Date('2026-10-29T03:35:00Z') }
    const previewTimeOffMock = vi
      .fn()
      .mockResolvedValueOnce({ affected: [a], removedSlots: 3 })
      .mockResolvedValueOnce({ affected: [b], removedSlots: 4 })
    const r = await previewTimeOff({ scheduling: { previewTimeOff: previewTimeOffMock } })([range, range])
    expect(r.value).toEqual({ affected: [b, a], removedSlots: 7 })
    await expect(previewTimeOff({ scheduling: { previewTimeOff: previewTimeOffMock } })([])).rejects.toMatchObject({
      code: 'validation_failed',
    })
  })

  it('requires a cover doctor to reassign and saves every range', async () => {
    const create = vi.fn((r: NewTimeOff) => Promise.resolve(saved(r)))
    const run = createTimeOff({ scheduling: { createTimeOff: create } })
    await expect(run([{ ...range, handling: 'reassign' }])).rejects.toMatchObject({
      fields: { coverPractitionerId: 'required' },
    })
    await expect(run([])).rejects.toMatchObject({ code: 'validation_failed' })
    await expect(run([range, range])).resolves.toMatchObject({ value: [{ id: 'to_1' }, { id: 'to_1' }] })
    expect(create).toHaveBeenCalledTimes(2)
  })
})

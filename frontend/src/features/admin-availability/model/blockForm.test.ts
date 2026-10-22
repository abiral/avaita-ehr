import { initialBlockForm, slotsPerDay, toggleDay, toNewBlocks } from './blockForm'

describe('A1 block form model', () => {
  it('toggles days in weekday order and counts slots', () => {
    expect(toggleDay([2], 1)).toEqual([1, 2])
    expect(toggleDay([1, 2], 2)).toEqual([1])
    const f = initialBlockForm('2026-10-26')
    expect(slotsPerDay(f)).toBe(9)
    expect(slotsPerDay({ ...f, slotMinutes: 40 })).toBe(4)
  })

  it('builds one block per chosen day; remote blocks have no room', () => {
    const f = { ...initialBlockForm('2026-10-26'), days: [1, 3] as const }
    expect(toNewBlocks({ ...f, days: [...f.days] }).map((b) => [b.weekday, b.room])).toEqual([
      [1, 'Room 5'],
      [3, 'Room 5'],
    ])
    expect(toNewBlocks({ ...f, days: [1], mode: 'remote' })[0]?.room).toBeNull()
    expect(toNewBlocks({ ...f, days: [1], room: 'video' })[0]?.room).toBeNull()
  })
})

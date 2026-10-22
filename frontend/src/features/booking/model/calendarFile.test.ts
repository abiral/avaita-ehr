import { icsHref, toIcs } from './calendarFile'

describe('calendar file', () => {
  it('builds an iCalendar event in UTC and escapes text', () => {
    const ics = toIcs({
      uid: 'ap_1',
      start: new Date('2026-10-21T04:35:00Z'),
      end: new Date('2026-10-21T04:55:00Z'),
      title: 'Dr. Prakash Karki, follow-up',
      location: 'OPD Block B; Room 5',
    })
    expect(ics).toContain('DTSTART:20261021T043500Z')
    expect(ics).toContain('SUMMARY:Dr. Prakash Karki\\, follow-up')
    expect(ics).toContain('LOCATION:OPD Block B\\; Room 5')
    expect(icsHref('A B')).toBe('data:text/calendar;charset=utf-8,A%20B')
  })
})

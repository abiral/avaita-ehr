/** A minimal iCalendar event the patient can save (no PHI beyond what they booked themselves). */
export function toIcs(input: { uid: string; start: Date; end: Date; title: string; location: string }): string {
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Folio//EN',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(input.start)}`,
    `DTSTART:${stamp(input.start)}`,
    `DTEND:${stamp(input.end)}`,
    `SUMMARY:${esc(input.title)}`,
    `LOCATION:${esc(input.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export const icsHref = (ics: string): string => `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`

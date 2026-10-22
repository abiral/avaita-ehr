import { errorMessage, t } from './t'
import {
  formatDate,
  formatDay,
  formatDayOfMonth,
  formatMoney,
  formatMonthShort,
  formatMonthYear,
  formatNumber,
  formatShortDate,
  formatTime,
  formatWeekday,
  formatWeekdayShort,
  formatZone,
} from './format'

describe('t()', () => {
  it('reads messages and fills params', () => {
    expect(t('common.appName')).toBe('Folio')
    expect(t('common.lock.signedInAs', { name: 'Dr. Anaya Shrestha' })).toBe('Signed in as Dr. Anaya Shrestha')
    expect(t('common.lock.signedInAs', {})).toBe('Signed in as {name}')
  })

  it('maps error codes with a generic fallback', () => {
    expect(errorMessage('slot_taken')).toMatch(/just booked/)
    expect(errorMessage('made_up_code')).toBe(t('common.errors.unknown'))
  })
})

describe('format', () => {
  const d = new Date('2026-11-03T03:45:00Z')
  it('formats in the facility zone, not the browser zone', () => {
    expect(formatTime(d, 'Asia/Kathmandu')).toBe('09:30')
    expect(formatTime(d, 'America/New_York')).toBe('22:45')
    expect(formatDay(d, 'Asia/Kathmandu')).toBe('Tuesday, 3 November')
    expect(formatShortDate(d, 'Asia/Kathmandu')).toBe('3 Nov')
    expect(formatDate(d, 'Asia/Kathmandu')).toBe('3 Nov 2026')
    expect(formatWeekdayShort(d, 'Asia/Kathmandu')).toBe('Tue')
    expect(formatWeekday(d, 'Asia/Kathmandu')).toBe('Tuesday')
    expect(formatMonthShort(d, 'Asia/Kathmandu')).toBe('Nov')
    expect(formatMonthYear(d, 'Asia/Kathmandu')).toBe('November 2026')
    expect(formatDayOfMonth(d, 'Asia/Kathmandu')).toBe('03')
    expect(formatZone(d, 'Asia/Kathmandu')).toMatch(/GMT\+5:45/)
  })

  it('formats numbers and money', () => {
    expect(formatNumber(1.234, 1)).toBe('1.2')
    expect(formatMoney(250000, 'NPR')).toMatch(/2,500/)
  })
})

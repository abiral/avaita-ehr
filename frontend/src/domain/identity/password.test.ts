import { checkPassword, passwordOk, safeReturnTo } from './password'

describe('password policy', () => {
  it('checks length, a number and the confirmation', () => {
    expect(checkPassword('short1')).toEqual({ length: false, number: true, match: true })
    expect(checkPassword('longenough-no-digit')).toEqual({ length: true, number: false, match: true })
    expect(checkPassword('kathmandu2026', 'kathmandu2027').match).toBe(false)
    expect(checkPassword('', '').match).toBe(false)
    expect(passwordOk(checkPassword('kathmandu2026', 'kathmandu2026'))).toBe(true)
  })
})

describe('safeReturnTo', () => {
  it.each([
    ['/portal/book', '/portal', '/portal/book'],
    ['/portal', '/portal', '/portal'],
    ['/staff/patients/pt_1', ['/staff', '/admin'], '/staff/patients/pt_1'],
    ['/admin/time-off', ['/staff', '/admin'], '/admin/time-off'],
    ['/staff', '/portal', null],
    ['//evil.example/x', '/portal', null],
    ['https://evil.example', '/portal', null],
    ['/portal\\..', '/portal', null],
    ['/portalx', '/portal', null],
    [null, '/portal', null],
  ] as const)('%s for %s is %s', (value, area, expected) => {
    expect(safeReturnTo(value, area)).toBe(expected)
  })
})

import { ApiError, AppError, SchemaError, errorCodeOf, hasCode } from './errors'
import { createEmitter } from './events'
import { redact } from './logger'
import { money } from './money'
import { err, ok } from './result'
import { systemClock } from './clock'

describe('core kernel', () => {
  it('builds results', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 })
    expect(err('x')).toEqual({ ok: false, error: 'x' })
  })

  it('types errors with codes', () => {
    const api = new ApiError('bad', 'slot_taken', 409, { start: 'taken' })
    expect(api).toBeInstanceOf(AppError)
    expect(api.name).toBe('ApiError')
    expect(hasCode(api, 'slot_taken')).toBe(true)
    expect(hasCode(new Error('x'), 'slot_taken')).toBe(false)
    expect(errorCodeOf(new SchemaError('/x', 'issue'))).toBe('schema_mismatch')
    expect(errorCodeOf('nope')).toBe('unknown')
  })

  it('emits typed events and unsubscribes', () => {
    const e = createEmitter<{ ping: number }>()
    const seen: number[] = []
    const off = e.on('ping', (n) => seen.push(n))
    e.emit('ping', 1)
    off()
    e.emit('ping', 2)
    expect(seen).toEqual([1])
  })

  it('redacts PHI keys in log data', () => {
    expect(redact({ patientName: 'x', status: 401, mrn: 'y' })).toEqual({
      patientName: '[redacted]',
      status: 401,
      mrn: '[redacted]',
    })
    expect(redact()).toEqual({})
  })

  it('rounds money and reads the clock', () => {
    expect(money(10.4, 'NPR')).toEqual({ minor: 10, currency: 'NPR' })
    expect(systemClock.now()).toBeInstanceOf(Date)
  })
})

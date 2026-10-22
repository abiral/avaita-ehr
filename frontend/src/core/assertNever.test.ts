import { assertNever } from './assertNever'

describe('assertNever', () => {
  it('throws for any value that reaches it', () => {
    expect(() => assertNever('x' as never)).toThrow('Unexpected value: x')
  })
})

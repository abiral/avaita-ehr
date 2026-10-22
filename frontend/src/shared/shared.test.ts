import { groupBy, sum, uniqueBy } from './array'
import { cx } from './cx'
import { matchesQuery, pad2 } from './string'

describe('shared helpers', () => {
  it('joins classes', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
  })
  it('groups, dedupes and sums', () => {
    expect(groupBy([1, 2, 3], (n) => (n % 2 ? 'odd' : 'even'))).toEqual({ odd: [1, 3], even: [2] })
    expect(uniqueBy(['a', 'A', 'b'], (s) => s.toLowerCase())).toEqual(['a', 'b'])
    expect(sum([1, 2, 3])).toBe(6)
  })
  it('matches queries word by word', () => {
    expect(matchesQuery('Dr. Prakash Karki Nephrology', 'karki neph')).toBe(true)
    expect(matchesQuery('Dr. Prakash Karki', 'rai')).toBe(false)
    expect(matchesQuery('anything', '  ')).toBe(true)
    expect(pad2(3)).toBe('03')
  })
})

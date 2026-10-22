import type { LabTest } from '@/domain/labs'
import { addSet, toggleTest, updateItem, visibleTests } from './basket'

const tests = [
  { code: 'RFP', name: 'Renal function panel', category: 'chemistry' },
  { code: 'CBC', name: 'Complete blood count', category: 'haematology' },
] as LabTest[]

describe('lab basket', () => {
  it('toggles tests, adds sets without duplicates and updates items', () => {
    const one = toggleTest([], 'RFP')
    expect(one).toEqual([{ testCode: 'RFP', priority: 'urgent', collect: 'now' }])
    expect(toggleTest(one, 'RFP')).toEqual([])
    const set = addSet(one, { id: 's', name: 'Set', testCodes: ['RFP', 'K'] })
    expect(set.map((b) => b.testCode)).toEqual(['RFP', 'K'])
    expect(updateItem(set, 'K', { priority: 'stat' })[1]).toMatchObject({ testCode: 'K', priority: 'stat' })
  })

  it('filters by category, or searches all categories', () => {
    expect(visibleTests(tests, 'chemistry', '').map((t) => t.code)).toEqual(['RFP'])
    expect(visibleTests(tests, 'chemistry', 'blood').map((t) => t.code)).toEqual(['CBC'])
  })
})

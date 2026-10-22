import type { LabCategory, LabTest, OrderSet, Priority } from '@/domain/labs'
import { matchesQuery } from '@/shared/string'

export const COLLECT_OPTIONS = ['now', 'next', 'tomorrow'] as const
export type CollectOption = (typeof COLLECT_OPTIONS)[number]

export interface BasketItem {
  readonly testCode: string
  readonly priority: Priority
  readonly collect: CollectOption
}

export const newItem = (testCode: string): BasketItem => ({ testCode, priority: 'urgent', collect: 'now' })

export const toggleTest = (basket: readonly BasketItem[], code: string): readonly BasketItem[] =>
  basket.some((b) => b.testCode === code) ? basket.filter((b) => b.testCode !== code) : [...basket, newItem(code)]

/** Adds every test in the set that is not already in the basket. */
export const addSet = (basket: readonly BasketItem[], set: OrderSet): readonly BasketItem[] => [
  ...basket,
  ...set.testCodes.filter((c) => !basket.some((b) => b.testCode === c)).map(newItem),
]

export const updateItem = (
  basket: readonly BasketItem[],
  code: string,
  patch: Partial<BasketItem>,
): readonly BasketItem[] => basket.map((b) => (b.testCode === code ? { ...b, ...patch } : b))

/** A search looks across every category; otherwise the chosen category is shown. */
export const visibleTests = (tests: readonly LabTest[], category: LabCategory, q: string): readonly LabTest[] =>
  q.trim() ? tests.filter((t) => matchesQuery(`${t.name} ${t.code}`, q)) : tests.filter((t) => t.category === category)

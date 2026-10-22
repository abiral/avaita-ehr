export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Record<K, T[]> {
  const out = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = out.get(k) ?? []
    list.push(item)
    out.set(k, list)
  }
  return Object.fromEntries(out) as Record<K, T[]>
}

export function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0)

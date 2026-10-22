import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import { matchesQuery } from '@/shared/string'

/** Published packages with a search box and category chips (P6 browse). */
export function usePackageList() {
  const { repos } = useServices()
  const keys = useKeys()
  const query = useQuery({ queryKey: keys.packages, queryFn: ({ signal }) => repos.packages.list(signal) })
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const all = query.data ?? []
  const categories = [...new Set(all.map((p) => p.category))]
  const visible = all.filter(
    (p) =>
      (category === null || p.category === category) &&
      matchesQuery(`${p.name} ${p.practitionerName} ${p.category}`, q),
  )
  return { query, all, visible, categories, q, setQ, category, setCategory }
}

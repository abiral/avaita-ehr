import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { Practitioner } from '@/domain/scheduling/types'
import { useDebounced } from '@/ui'

const byNextAvailable = (a: Practitioner, b: Practitioner): number =>
  (a.nextAvailableAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.nextAvailableAt?.getTime() ?? Number.MAX_SAFE_INTEGER)

export interface CategoryCount {
  readonly category: string | null
  readonly count: number
}

/** P5 search: server-side match on name, speciality and keywords; chip counts follow the search. */
export function useDoctorSearch() {
  const { repos } = useServices()
  const keys = useKeys()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const debounced = useDebounced(q.trim(), 250)
  const query = useQuery({
    queryKey: keys.practitioners({ q: debounced }),
    queryFn: ({ signal }) => repos.practitioners.list({ q: debounced }, signal),
    placeholderData: (previous) => previous,
  })
  const matches = [...(query.data ?? [])].sort(byNextAvailable)
  const categories = [...new Set(matches.map((d) => d.category))]
  const counts: CategoryCount[] = [
    { category: null, count: matches.length },
    ...categories.map((c) => ({ category: c, count: matches.filter((d) => d.category === c).length })),
  ]
  const doctors = category ? matches.filter((d) => d.category === category) : matches
  const reset = () => {
    setQ('')
    setCategory(null)
  }
  return { q, setQ, category, setCategory, counts, doctors, all: query.data ?? [], loading: query.isPending, reset }
}

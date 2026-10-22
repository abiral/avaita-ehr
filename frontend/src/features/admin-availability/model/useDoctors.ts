import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import { matchesQuery } from '@/shared/string'

/** Doctor list with a local filter and the selected doctor (A1 and A2). */
export function useDoctors(initial: PractitionerId | null = null) {
  const { repos } = useServices()
  const keys = useKeys()
  const query = useQuery({
    queryKey: keys.practitioners({}),
    queryFn: ({ signal }) => repos.practitioners.list({}, signal),
  })
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<PractitionerId | null>(initial)
  const all = query.data ?? []
  const selected = all.find((d) => d.id === picked) ?? all[0] ?? null
  const visible = all.filter((d) => matchesQuery(`${d.displayName} ${d.category}`, q))
  return { query, all, visible, q, setQ, selected, pick: setPicked }
}

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PatientListItem } from '@/domain/clinical/types'
import { useDebounced } from '@/ui'

const MIN_CHARS = 2
const DEBOUNCE_MS = 250

/** Facility patient lookup by name or MRN; the text travels in a header, never the address bar. */
export function usePatientSearch() {
  const { repos } = useServices()
  const keys = useKeys()
  const [query, setQuery] = useState('')
  const [patient, setPatient] = useState<PatientListItem | null>(null)
  const q = useDebounced(query.trim(), DEBOUNCE_MS)
  const results = useQuery({
    queryKey: keys.patientSearch(q),
    queryFn: ({ signal }) => repos.clinical.searchPatients(q, signal),
    enabled: q.length >= MIN_CHARS,
  })
  const choose = (id: string) => {
    const found = results.data?.find((p) => p.id === id) ?? null
    setPatient(found)
    setQuery('')
  }
  const clear = () => {
    setPatient(null)
  }
  return { query, setQuery, options: q.length >= MIN_CHARS ? (results.data ?? []) : [], patient, choose, clear }
}

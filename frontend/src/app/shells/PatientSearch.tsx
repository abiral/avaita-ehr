import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { t } from '@/i18n'
import { Combobox, useDebounced } from '@/ui'
import { paths } from '../routes'
import { useServices } from '../ServicesProvider'
import { useKeys } from '../useKeys'

const MIN_CHARS = 2
const DEBOUNCE_MS = 250

/** Top-bar search by name or MRN; the text travels in a header and choosing a patient opens the chart. */
export function PatientSearch() {
  const { repos } = useServices()
  const keys = useKeys()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const q = useDebounced(query.trim(), DEBOUNCE_MS)
  const results = useQuery({
    queryKey: keys.patientSearch(q),
    queryFn: ({ signal }) => repos.clinical.searchPatients(q, signal),
    enabled: q.length >= MIN_CHARS,
  })
  const options = q.length >= MIN_CHARS ? (results.data ?? []) : []
  return (
    <Combobox
      label={t('shell.staff.searchPatients')}
      placeholder={t('shell.staff.searchPlaceholder')}
      query={query}
      onQueryChange={setQuery}
      options={options.map((p) => ({ id: p.id, label: p.displayName, meta: p.bed ? `${p.mrn} · ${p.bed}` : p.mrn }))}
      onSelect={(o) => {
        setQuery('')
        void navigate(paths.staff.chart(o.id))
      }}
      emptyText={t('shell.staff.noPatients')}
    />
  )
}

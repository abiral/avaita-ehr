import { useQueries } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { LocalDate, Practitioner, VisitMode } from '@/domain/scheduling/types'
import { addLocalDays, atLocal } from '@/domain/time'

export const SUGGESTION_COUNT = 4
const SEARCH_DAYS = 7

export interface Suggestion {
  readonly doctor: Practitioner
  readonly start: Date
}

/** The earliest open slots from the chosen day on, across one clinician or all of them. */
export function useSuggestions(doctors: readonly Practitioner[], mode: VisitMode, date: LocalDate) {
  const { repos, clock } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const range = {
    from: atLocal(date, '00:00', timeZone),
    to: atLocal(addLocalDays(date, SEARCH_DAYS), '00:00', timeZone),
  }
  const results = useQueries({
    queries: doctors.map((d) => ({
      queryKey: keys.slots(d.id, mode, date),
      queryFn: ({ signal }: { signal: AbortSignal }) => repos.scheduling.slots(d.id, mode, range, signal),
    })),
  })
  const now = clock.now().getTime()
  const suggestions: Suggestion[] = results
    .flatMap((r, i) => {
      const doctor = doctors[i]
      return doctor ? (r.data ?? []).filter((s) => s.available).map((s) => ({ doctor, start: s.start })) : []
    })
    .filter((s) => s.start.getTime() > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, SUGGESTION_COUNT)
  return { suggestions, loading: results.some((r) => r.isPending) }
}

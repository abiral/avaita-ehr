import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import { byBed } from './patientRows'

/** Ward census for C2 and C3, sorted by bed. */
export function useWardPatients() {
  const { repos } = useServices()
  const keys = useKeys()
  return useQuery({
    queryKey: keys.patients,
    queryFn: ({ signal }) => repos.clinical.patients(signal),
    select: (rows) => [...rows].sort(byBed),
  })
}

/** C2: attention items, agenda and counts. */
export function useToday() {
  const { repos } = useServices()
  const keys = useKeys()
  return useQuery({ queryKey: keys.today, queryFn: ({ signal }) => repos.clinical.today(signal) })
}

import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import { firstVisitMode, type PackageFormat } from '@/domain/packages'
import { addLocalDays, atLocal, localDateOf } from '@/domain/time'

export const FIRST_VISIT_CHOICES = 4
const SEARCH_DAYS = 14

/** The earliest open slots for the first visit, in the mode the format strategy allows. */
export function useFirstVisitSlots(practitionerId: PractitionerId | null, format: PackageFormat | null) {
  const { repos, clock } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const tomorrow = addLocalDays(localDateOf(clock.now(), timeZone), 1)
  const range = {
    from: atLocal(tomorrow, '00:00', timeZone),
    to: atLocal(addLocalDays(tomorrow, SEARCH_DAYS), '00:00', timeZone),
  }
  const mode = format ? firstVisitMode(format) : 'onsite'
  const id = practitionerId ?? ('' as PractitionerId)
  const slots = useQuery({
    queryKey: keys.slots(id, mode, `${tomorrow}+${String(SEARCH_DAYS)}`),
    queryFn: ({ signal }) => repos.scheduling.slots(id, mode, range, signal),
    enabled: practitionerId !== null && format !== null,
  })
  const open = (slots.data ?? []).filter((s) => s.available).slice(0, FIRST_VISIT_CHOICES)
  return { slots: open, loading: slots.isPending && practitionerId !== null, mode }
}

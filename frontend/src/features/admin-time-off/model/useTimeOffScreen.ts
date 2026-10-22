import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import { toTimeOffRanges, type TimeOffDraft } from '@/domain/scheduling'
import { addLocalDays, atLocal, localDateOf } from '@/domain/time'
import { useDoctors } from '@/features/admin-availability'
import { addMonths, monthStart, upcoming } from './calendar'
import { useTimeOffSubmit } from './useTimeOffSubmit'

const rangeOf = (from: string, to: string, timeZone: string) => ({
  from: atLocal(from, '00:00', timeZone).toISOString(),
  to: atLocal(to, '00:00', timeZone).toISOString(),
})

function useTimeOffLists(month: string, today: string) {
  const { repos, clock } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const load = (r: { from: string; to: string }) => (signal: AbortSignal) =>
    repos.scheduling.timeOff({ from: new Date(r.from), to: new Date(r.to) }, signal)
  const shown = rangeOf(month, addMonths(month, 1), timeZone)
  const ahead = rangeOf(today, addLocalDays(today, 90), timeZone)
  const calendar = useQuery({ queryKey: keys.timeOff(shown), queryFn: ({ signal }) => load(shown)(signal) })
  const next = useQuery({ queryKey: keys.timeOff(ahead), queryFn: ({ signal }) => load(ahead)(signal) })
  return { calendar, upcomingItems: upcoming(next.data ?? [], clock.now()), upcomingLoading: next.isPending }
}

/** Container hook for A2: calendar, upcoming list and the block-time form with its impact check. */
export function useTimeOffScreen() {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const today = localDateOf(clock.now(), timeZone)
  const [month, setMonth] = useState(monthStart(today))
  const lists = useTimeOffLists(month, today)
  const doctors = useDoctors()
  const [draft, setDraft] = useState<TimeOffDraft>({
    practitionerId: null,
    kind: 'full',
    from: today,
    to: today,
    startTime: '13:00',
    endTime: '17:00',
    reason: 'personal',
    patientNote: '',
    handling: 'notify',
    coverPractitionerId: null,
  })
  const effective: TimeOffDraft = { ...draft, practitionerId: draft.practitionerId ?? doctors.all[0]?.id ?? null }
  const submit = useTimeOffSubmit(effective, toTimeOffRanges(effective, timeZone))
  return { today, month, setMonth, lists, doctors, draft: effective, setDraft, ...submit }
}

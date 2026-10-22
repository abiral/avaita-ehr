import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import type { DateRange, Practitioner, VisitMode } from '@/domain/scheduling/types'
import { addLocalDays, atLocal } from '@/domain/time'
import { dayViews, stripDates } from './days'

const NO_DOCTOR = '' as PractitionerId

function useStripRange(): { dates: string[]; first: string; range: DateRange } {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const dates = stripDates(clock.now(), timeZone)
  const first = dates[0] ?? ''
  const range = {
    from: atLocal(first, '00:00', timeZone),
    to: atLocal(addLocalDays(first, dates.length), '00:00', timeZone),
  }
  return { dates, first, range }
}

function usePickerQueries(id: PractitionerId, mode: VisitMode, enabled: boolean) {
  const { repos } = useServices()
  const keys = useKeys()
  const { first, range } = useStripRange()
  const slots = useQuery({
    queryKey: keys.slots(id, mode, first),
    queryFn: ({ signal }) => repos.scheduling.slots(id, mode, range, signal),
    enabled,
  })
  const blocks = useQuery({
    queryKey: keys.availability(id),
    queryFn: ({ signal }) => repos.scheduling.blocks(id, signal),
    enabled,
  })
  const leave = useQuery({
    queryKey: keys.timeOff({ from: range.from.toISOString(), to: range.to.toISOString() }),
    queryFn: ({ signal }) => repos.scheduling.timeOff(range, signal),
    enabled,
  })
  const rules = useQuery({ queryKey: keys.rules, queryFn: ({ signal }) => repos.scheduling.rules(signal) })
  return { slots, blocks, leave, rules }
}

type Queries = ReturnType<typeof usePickerQueries>
interface Picked {
  readonly doctor: Practitioner | null
  readonly mode: VisitMode | null
}

function pickerContext(q: Queries, id: PractitionerId, timeZone: string) {
  const timeOff = (q.leave.data ?? []).filter((o) => o.practitionerId === id)
  const context =
    q.blocks.data && q.rules.data ? { blocks: q.blocks.data, timeOff, rules: q.rules.data, timeZone } : null
  return { timeOff, context }
}

function stripDays(
  q: Queries,
  picked: Picked,
  base: ReturnType<typeof pickerContext>['context'],
  at: { dates: string[]; now: Date },
) {
  const { doctor, mode } = picked
  if (!base || !doctor || !mode || !q.slots.data) return null
  return dayViews(at.dates, { ...base, mode, practitioner: doctor, now: at.now }, q.slots.data)
}

/** Slots, blocks, leave and rules for the date strip of one doctor and mode. */
export function useSlotPicker(doctor: Practitioner | null, mode: VisitMode | null) {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const { dates } = useStripRange()
  const id = doctor?.id ?? NO_DOCTOR
  const q = usePickerQueries(id, mode ?? 'onsite', doctor !== null && mode !== null)
  const { timeOff, context } = pickerContext(q, id, timeZone)
  return {
    slots: q.slots.data ?? [],
    days: stripDays(q, { doctor, mode }, context, { dates, now: clock.now() }),
    context,
    timeOff,
    rules: q.rules.data,
    loading: q.slots.isPending || q.blocks.isPending || q.leave.isPending,
    refetch: () => q.slots.refetch(),
  }
}

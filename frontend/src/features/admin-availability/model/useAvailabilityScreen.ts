import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import { addLocalDays, localDateOf, weekdayOfLocal } from '@/domain/time'
import { initialBlockForm, type BlockForm } from './blockForm'
import { useAvailabilityMutations } from './useAvailabilityMutations'
import { useDoctors } from './useDoctors'

const nextMonday = (today: string): string => addLocalDays(today, (8 - weekdayOfLocal(today)) % 7 || 7)

/** Container hook for A1: doctor list, weekly template, booking rules and the new-block form. */
export function useAvailabilityScreen() {
  const { repos, clock } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const doctors = useDoctors()
  const doctor = doctors.selected
  const blocks = useQuery({
    queryKey: keys.availability(doctor?.id ?? ('' as PractitionerId)),
    queryFn: ({ signal }) => (doctor ? repos.scheduling.blocks(doctor.id, signal) : Promise.resolve([])),
    enabled: doctor !== null,
  })
  const rules = useQuery({ queryKey: keys.rules, queryFn: ({ signal }) => repos.scheduling.rules(signal) })
  const [form, setForm] = useState<BlockForm>(() => initialBlockForm(nextMonday(localDateOf(clock.now(), timeZone))))
  const writes = useAvailabilityMutations(doctor, blocks.data ?? [], form)
  const pickDoctor = (id: PractitionerId) => {
    doctors.pick(id)
    writes.reset()
  }
  return { doctors, doctor, blocks, rules, form, setForm, pickDoctor, ...writes }
}

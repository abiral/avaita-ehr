import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import type { Appointment } from '@/domain/appointments'
import type { LocalDate, Practitioner } from '@/domain/scheduling/types'
import { addLocalDays, atLocal } from '@/domain/time'
import { formatTime, t } from '@/i18n'
import { columnItems, type GridItem } from './grid'

export interface ClinicColumn {
  readonly doctor: Practitioner
  readonly items: readonly GridItem[]
}

const describe = (timeZone: string) => (a: Appointment) => {
  if (a.status === 'cancelled')
    return a.cancelledBy === 'patient' ? t('staff.schedule.cancelledByPatient') : t('staff.schedule.cancelledByStaff')
  return `${formatTime(a.start, timeZone)} · ${a.reason}`
}

/** Refetches the day when anyone books, cancels or blocks time (ids only arrive, never PHI). */
function useLiveRefresh() {
  const { realtime } = useServices()
  const client = useQueryClient()
  const keys = useKeys()
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries({ queryKey: keys.appointments.all })
      void client.invalidateQueries({ queryKey: keys.allTimeOff })
    }
    const offs = [realtime.subscribe('appointment.changed', refresh), realtime.subscribe('time-off.created', refresh)]
    return () => {
      offs.forEach((off) => {
        off()
      })
    }
  }, [realtime, client, keys])
}

/** Clinicians of this facility with their appointments and blocked time on one day (C4). */
export function useClinicDay(date: LocalDate) {
  const { repos } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  useLiveRefresh()
  const range = { from: atLocal(date, '00:00', timeZone), to: atLocal(addLocalDays(date, 1), '00:00', timeZone) }
  const clinicians = useQuery({
    queryKey: keys.practitioners({ staffOnly: true }),
    queryFn: ({ signal }) => repos.practitioners.list({ staffOnly: true }, signal),
  })
  const doctors = [...(clinicians.data ?? [])].sort((a, b) => a.displayName.localeCompare(b.displayName))
  const days = useQueries({
    queries: doctors.map((d) => ({
      queryKey: keys.practitionerDay(d.id, date),
      queryFn: ({ signal }: { signal: AbortSignal }) => repos.appointments.listForPractitioner(d.id, range, signal),
    })),
  })
  const leave = useQuery({
    queryKey: keys.timeOff({ from: range.from.toISOString(), to: range.to.toISOString() }),
    queryFn: ({ signal }) => repos.scheduling.timeOff(range, signal),
  })
  const labels = { blocked: t('staff.schedule.blocked'), onLeave: t('staff.schedule.onLeave') }
  const columns: ClinicColumn[] = doctors.map((doctor, i) => ({
    doctor,
    items: columnItems({
      appointments: days[i]?.data ?? [],
      timeOff: (leave.data ?? []).filter((o) => o.practitionerId === doctor.id),
      date,
      timeZone,
      describe: describe(timeZone),
      labels,
    }),
  }))
  const loading = clinicians.isPending || leave.isPending || days.some((d) => d.isPending)
  const failed = clinicians.isError || leave.isError || days.some((d) => d.isError)
  const retry = () => {
    void clinicians.refetch()
    void leave.refetch()
    days.forEach((d) => void d.refetch())
  }
  return { columns, doctors, loading, failed, retry }
}

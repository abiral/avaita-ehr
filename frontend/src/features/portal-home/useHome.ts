import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import { nextAppointment, splitAppointments } from '@/domain/appointments'

/** P4: appointments, reports and medicines for the home page, each loaded on its own. */
export function useHome() {
  const { repos, clock } = useServices()
  const keys = useKeys()
  const now = clock.now()
  const appointments = useQuery({
    queryKey: keys.appointments.mine,
    queryFn: ({ signal }) => repos.appointments.listMine(signal),
  })
  const reports = useQuery({ queryKey: keys.myReports, queryFn: ({ signal }) => repos.labs.myReports(signal) })
  const medicines = useQuery({ queryKey: keys.myMedications, queryFn: ({ signal }) => repos.medications.mine(signal) })
  const next = nextAppointment(appointments.data ?? [], now)
  const doctorId = next?.practitionerId ?? ('' as PractitionerId)
  const doctor = useQuery({
    queryKey: keys.practitioner(doctorId),
    queryFn: ({ signal }) => repos.practitioners.get(doctorId, signal),
    enabled: doctorId !== '',
  })
  const upcoming = splitAppointments(appointments.data ?? [], now).upcoming
  const prep = upcoming.find((a) => a.status === 'booked' && a.kind === 'lab' && a.preparation) ?? null
  return { appointments, reports, medicines, next, category: doctor.data?.category ?? '', prep }
}

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PractitionerId } from '@/core/branded'
import { initialBooking, rescheduleBooking } from '@/domain/appointments'
import type { FlowStart } from './useBookingFlow'

/** With ?reschedule=<id>, starts at the slot step for that appointment's doctor and mode. */
export function useRescheduleTarget(): { readonly ready: boolean; readonly start: FlowStart } {
  const { repos } = useServices()
  const keys = useKeys()
  const [params] = useSearchParams()
  const id = params.get('reschedule')
  const mine = useQuery({
    queryKey: keys.appointments.mine,
    queryFn: ({ signal }) => repos.appointments.listMine(signal),
    enabled: id !== null,
  })
  const appt = mine.data?.find((a) => a.id === id && a.practitionerId)
  const doctorId = (appt?.practitionerId ?? '') as PractitionerId
  const doctor = useQuery({
    queryKey: keys.practitioner(doctorId),
    queryFn: ({ signal }) => repos.practitioners.get(doctorId, signal),
    enabled: Boolean(appt),
  })
  if (!id) return { ready: true, start: { state: initialBooking, doctor: null, rescheduleId: null } }
  if (!appt || !doctor.data)
    return {
      ready: mine.isError || (mine.isSuccess && !appt),
      start: { state: initialBooking, doctor: null, rescheduleId: null },
    }
  return {
    ready: true,
    start: {
      state: rescheduleBooking(doctor.data.id, appt.mode),
      doctor: doctor.data,
      rescheduleId: appt.id,
    },
  }
}

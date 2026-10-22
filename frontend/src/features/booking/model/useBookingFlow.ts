import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { AppointmentId } from '@/core/branded'
import { errorCodeOf, hasCode } from '@/core/errors'
import { bookingFlow, type BookingState } from '@/domain/appointments'
import type { Practitioner, VisitMode } from '@/domain/scheduling/types'
import { errorMessage } from '@/i18n'
import { useDoctorSearch } from './useDoctorSearch'
import { useSlotPicker } from './useSlotPicker'

export interface FlowStart {
  readonly state: BookingState
  readonly doctor: Practitioner | null
  readonly rescheduleId: AppointmentId | null
}

/** Container hook for P5: search, mode, date strip, slot and confirm, driven by the bookingFlow machine. */
export function useBookingFlow(start: FlowStart) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const [state, dispatch] = useReducer(bookingFlow, start.state)
  const [doctor, setDoctor] = useState<Practitioner | null>(start.doctor)
  const [reason, setReason] = useState('')
  const search = useDoctorSearch()
  const picker = useSlotPicker(doctor, state.mode)
  const firstOpen = picker.days?.find((d) => d.status === 'open')?.date ?? null
  useEffect(() => {
    if (state.step === 'slot' && !state.day && firstOpen) dispatch({ type: 'pick-day', day: firstOpen })
  }, [state.step, state.day, firstOpen])
  const pickDoctor = (d: Practitioner) => {
    setDoctor(d)
    dispatch({ type: 'pick-doctor', doctor: d.id, mode: preferredMode(d) })
  }
  const submit = () => {
    if (!doctor || !state.mode || !state.start || !picker.context) return
    dispatch({ type: 'submit' })
    const input = {
      practitioner: doctor,
      patientId: null,
      mode: state.mode,
      start: state.start,
      reason,
      context: { ...picker.context, taken: picker.slots.filter((s) => !s.available).map((s) => s.start) },
    }
    const run = start.rescheduleId
      ? useCases.rescheduleAppointment({ ...input, appointmentId: start.rescheduleId })
      : useCases.bookAppointment(input)
    run.then(
      async (r) => {
        dispatch({ type: 'booked', appointmentId: r.value.id })
        await Promise.all([
          client.invalidateQueries({ queryKey: keys.appointments.all }),
          client.invalidateQueries({ queryKey: keys.allSlots }),
        ])
      },
      async (e: unknown) => {
        dispatch({ type: 'failed', error: errorMessage(errorCodeOf(e)) })
        if (hasCode(e, 'slot_taken') || hasCode(e, 'practitioner_on_leave')) await picker.refetch()
      },
    )
  }
  return {
    state,
    dispatch,
    doctor,
    pickDoctor,
    reason,
    setReason,
    search,
    picker,
    submit,
    rescheduling: start.rescheduleId !== null,
  }
}

const preferredMode = (d: Practitioner): VisitMode | null => {
  if (d.offersOnsite) return 'onsite'
  return d.offersRemote ? 'remote' : null
}

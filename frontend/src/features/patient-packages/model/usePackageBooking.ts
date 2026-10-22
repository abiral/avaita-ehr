import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useReducer } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import { errorCodeOf } from '@/core/errors'
import { initialPackageBooking, packageBookingFlow, type ConsultationPackage } from '@/domain/packages'
import { errorMessage } from '@/i18n'
import { useFirstVisitSlots } from './useFirstVisitSlots'

/** P6: the packageBookingFlow machine, first-visit slots and the enrolment call. */
export function usePackageBooking(packages: readonly ConsultationPackage[]) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const [state, dispatch] = useReducer(packageBookingFlow, initialPackageBooking)
  const pkg = packages.find((p) => p.id === state.packageId) ?? null
  const firstVisit = useFirstVisitSlots(pkg?.practitionerId ?? null, state.format)
  const enroll = useMutation({
    mutationFn: (input: { pkg: ConsultationPackage; start: Date }) => {
      if (!state.format) throw new Error('format required')
      return useCases.enrollInPackage({ pkg: input.pkg, chosenFormat: state.format, start: input.start })
    },
    onSuccess: async ({ value }) => {
      dispatch({ type: 'booked', enrollmentId: value.id })
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.appointments.all }),
        client.invalidateQueries({ queryKey: keys.allSlots }),
        client.invalidateQueries({ queryKey: keys.packages }),
      ])
    },
    onError: (e) => {
      dispatch({ type: 'failed', error: errorMessage(errorCodeOf(e)) })
    },
  })
  const submit = () => {
    if (!pkg || !state.start || state.step !== 'first-visit') return
    dispatch({ type: 'submit' })
    enroll.mutate({ pkg, start: state.start })
  }
  return { state, dispatch, pkg, firstVisit, submit }
}

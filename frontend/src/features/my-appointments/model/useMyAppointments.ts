import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import { errorCodeOf } from '@/core/errors'
import { splitAppointments, type Appointment, type CancelReason } from '@/domain/appointments'
import { errorMessage } from '@/i18n'
import { dayLine } from './labels'

export type Notice =
  | { readonly kind: 'cancelled'; readonly appointment: Appointment; readonly day: string }
  | { readonly kind: 'restored' }
  | { readonly kind: 'error'; readonly text: string }
  | null

/** Container hook for P7: upcoming and past, cancel with reason, and Undo while the server allows it. */
export function useMyAppointments() {
  const { repos, useCases, clock } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const client = useQueryClient()
  const list = useQuery({
    queryKey: keys.appointments.mine,
    queryFn: ({ signal }) => repos.appointments.listMine(signal),
  })
  const rules = useQuery({ queryKey: keys.rules, queryFn: ({ signal }) => repos.scheduling.rules(signal) })
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [asking, setAsking] = useState<Appointment | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.appointments.all }),
      client.invalidateQueries({ queryKey: keys.allSlots }),
    ])
  const cutoffMinutes = rules.data?.cancelCutoffMinutes ?? 240
  const cancel = useMutation({
    mutationFn: (input: { appointment: Appointment; reason: CancelReason }) =>
      useCases.cancelAppointment({ ...input, cutoffMinutes, actor: 'patient' }),
    onSuccess: async (r) => {
      setAsking(null)
      setNotice({ kind: 'cancelled', appointment: r.value, day: dayLine(r.value, timeZone) })
      await refresh()
    },
    onError: (e) => {
      setAsking(null)
      setNotice({ kind: 'error', text: errorMessage(errorCodeOf(e)) })
    },
  })
  const undo = useMutation({
    mutationFn: (a: Appointment) => repos.appointments.restore(a.id),
    onSuccess: async () => {
      setNotice({ kind: 'restored' })
      await refresh()
    },
    onError: (e) => {
      setNotice({ kind: 'error', text: errorMessage(errorCodeOf(e)) })
    },
  })
  const split = splitAppointments(list.data ?? [], clock.now())
  return { list, split, tab, setTab, asking, setAsking, notice, cancel, undo, cutoffMinutes, now: clock.now() }
}

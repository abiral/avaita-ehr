import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import { errorCodeOf } from '@/core/errors'
import type { PatientListItem } from '@/domain/clinical/types'
import type { LocalDate, Practitioner, VisitMode } from '@/domain/scheduling/types'
import { errorMessage, formatShortDay, formatTime, formatWeekdayShort, t } from '@/i18n'
import { useToast } from '@/ui'
import { usePatientSearch } from './usePatientSearch'
import { useSuggestions, type Suggestion } from './useSuggestions'

export const VISIT_TYPES = ['follow-up', 'new', 'video'] as const
export type VisitType = (typeof VISIT_TYPES)[number]
export const FIRST_AVAILABLE = 'first'

const modeOf = (v: VisitType): VisitMode => (v === 'video' ? 'remote' : 'onsite')

export const slotLabel = (s: Suggestion, timeZone: string): string =>
  `${formatWeekdayShort(s.start, timeZone)} ${formatTime(s.start, timeZone)}`

interface BookArgs {
  readonly patient: PatientListItem
  readonly slot: Suggestion
  readonly mode: VisitMode
  readonly reason: string
  readonly sms: boolean
}

const DAY_MS = 86_400_000

function useBookMutation(onDone: () => void) {
  const { repos, useCases } = useServices()
  const { timeZone } = useTenant()
  const keys = useKeys()
  const client = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async ({ patient, slot, mode, reason, sms }: BookArgs) => {
      const around = { from: new Date(slot.start.getTime() - DAY_MS), to: new Date(slot.start.getTime() + DAY_MS) }
      const [blocks, rules, leave] = await Promise.all([
        repos.scheduling.blocks(slot.doctor.id),
        repos.scheduling.rules(),
        repos.scheduling.timeOff(around),
      ])
      const timeOff = leave.filter((o) => o.practitionerId === slot.doctor.id)
      const context = { blocks, timeOff, rules, timeZone }
      const base = { practitioner: slot.doctor, patientId: patient.id, start: slot.start, reason, notifyBySms: sms }
      return useCases.bookAppointment({ ...base, mode, context })
    },
    onSuccess: async ({ value }, { patient }) => {
      toast.show({
        message: t('staff.bookFor.booked', {
          patient: patient.displayName,
          doctor: value.practitionerName,
          when: `${formatShortDay(value.start, timeZone)} ${formatTime(value.start, timeZone)}`,
        }),
      })
      onDone()
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.appointments.all }),
        client.invalidateQueries({ queryKey: keys.allSlots }),
      ])
    },
  })
}

/** C4 side panel: patient, visit type, clinician, suggested times, note and SMS choice. */
export function useBookFor(doctors: readonly Practitioner[], date: LocalDate) {
  const search = usePatientSearch()
  const [visitType, setVisitType] = useState<VisitType>('follow-up')
  const [chosenClinician, setClinician] = useState<string | null>(null)
  const clinician = chosenClinician ?? doctors[0]?.id ?? FIRST_AVAILABLE
  const [picked, setPicked] = useState(0)
  const [note, setNote] = useState('')
  const [sms, setSms] = useState(true)
  const chosen = clinician === FIRST_AVAILABLE ? doctors : doctors.filter((d) => d.id === clinician)
  const { suggestions, loading } = useSuggestions(chosen, modeOf(visitType), date)
  const slot = suggestions[picked] ?? suggestions[0] ?? null
  const mutation = useBookMutation(() => {
    search.clear()
    setNote('')
    setPicked(0)
  })
  const reason = [t(`staff.bookFor.reasons.${visitType}`), note.trim()].filter(Boolean).join(' · ')
  const book = () => {
    if (!search.patient || !slot) return
    mutation.mutate({ patient: search.patient, slot, mode: modeOf(visitType), reason, sms })
  }
  const error = mutation.error ? errorMessage(errorCodeOf(mutation.error)) : null
  const fields = { visitType, setVisitType, clinician, setClinician, note, setNote, sms, setSms }
  return { search, fields, suggestions, loading, slot, picked, setPicked, book, busy: mutation.isPending, error }
}

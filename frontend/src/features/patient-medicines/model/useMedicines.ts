import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { MedicationId } from '@/core/branded'
import { errorCodeOf } from '@/core/errors'
import type { Medication, Pickup } from '@/domain/medications'
import { errorMessage } from '@/i18n'
import { defaultPanel } from './medicineView'

export interface RefillForm {
  readonly quantityDays: 30 | 60 | 90
  readonly pickup: Pickup
  readonly note: string
}

const INITIAL_FORM: RefillForm = { quantityDays: 30, pickup: 'hospital-pharmacy', note: '' }

/** P9: medicines, the refill panel and sending a request. */
export function useMedicines() {
  const { repos, useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const query = useQuery({ queryKey: keys.myMedications, queryFn: ({ signal }) => repos.medications.mine(signal) })
  const meds = query.data?.medications ?? []
  const [chosen, setChosen] = useState<MedicationId | 'none' | null>(null)
  const [form, setForm] = useState<RefillForm>(INITIAL_FORM)
  const [sent, setSent] = useState<string | null>(null)
  const panel =
    chosen === 'none'
      ? null
      : (meds.find((m) => m.id === chosen) ?? (chosen === null && !sent ? defaultPanel(meds) : null))
  const send = useMutation({
    mutationFn: (medication: Medication) =>
      useCases.requestRefill({ medication, medicationId: medication.id, ...form }),
    onSuccess: async ({ value }) => {
      setSent(value.name)
      setChosen('none')
      setForm(INITIAL_FORM)
      await client.invalidateQueries({ queryKey: keys.myMedications })
    },
  })
  const open = (id: MedicationId) => {
    setChosen(id)
    setForm(INITIAL_FORM)
    send.reset()
  }
  const error = send.error ? errorMessage(errorCodeOf(send.error)) : null
  return { query, meds, panel, open, close: () => setChosen('none'), form, setForm, send, sent, error }
}

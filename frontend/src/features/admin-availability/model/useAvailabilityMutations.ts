import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { BlockId } from '@/core/branded'
import { ApiError, errorCodeOf } from '@/core/errors'
import type { AvailabilityBlock, BookingRules, Practitioner } from '@/domain/scheduling/types'
import { errorMessage } from '@/i18n'
import { toNewBlocks, type BlockForm } from './blockForm'

export type AvailabilityStatus =
  | { readonly tone: 'ok'; readonly kind: 'saved' | 'removed' | 'rules' }
  | { readonly tone: 'error'; readonly text: string }
  | null

const blockProblem = (e: unknown): string | null => (e instanceof ApiError ? (e.fields.blocks ?? null) : null)

/** A1 writes: save or remove a block and save booking rules, with the page status line. */
export function useAvailabilityMutations(
  doctor: Practitioner | null,
  existing: readonly AvailabilityBlock[],
  form: BlockForm,
) {
  const { repos, useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const [status, setStatus] = useState<AvailabilityStatus>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: keys.allSlots })
    if (doctor) await client.invalidateQueries({ queryKey: keys.availability(doctor.id) })
  }
  const saveBlock = useMutation({
    mutationFn: async () => {
      if (!doctor) throw new Error('No doctor')
      return useCases.saveAvailabilityBlock({ practitionerId: doctor.id, blocks: toNewBlocks(form), existing })
    },
    onSuccess: async () => {
      setProblem(null)
      setStatus({ tone: 'ok', kind: 'saved' })
      await invalidate()
    },
    onError: (e) => {
      const p = blockProblem(e)
      setProblem(p)
      setStatus(p ? null : { tone: 'error', text: errorMessage(errorCodeOf(e)) })
    },
  })
  const removeBlock = useMutation({
    mutationFn: async (id: BlockId) => {
      if (doctor) await repos.scheduling.deleteBlock(doctor.id, id)
    },
    onSuccess: async () => {
      setStatus({ tone: 'ok', kind: 'removed' })
      await invalidate()
    },
  })
  const saveRules = useMutation({
    mutationFn: (next: BookingRules) => useCases.saveBookingRules(next),
    onSuccess: async (r) => {
      client.setQueryData(keys.rules, r.value)
      setStatus({ tone: 'ok', kind: 'rules' })
      await client.invalidateQueries({ queryKey: keys.allSlots })
    },
  })
  const reset = () => {
    setStatus(null)
    setProblem(null)
  }
  return { saveBlock, removeBlock, saveRules, status, problem, reset }
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { LabResultId, PatientId } from '@/core/branded'
import { errorCodeOf } from '@/core/errors'
import type { LabResult } from '@/domain/labs'
import { errorMessage, t } from '@/i18n'
import { sortInbox } from './trend'

export type ReviewMode = { readonly kind: 'inbox' } | { readonly kind: 'chart'; readonly patientId: PatientId }

function useInbox(mode: ReviewMode) {
  const { repos } = useServices()
  const keys = useKeys()
  return useQuery({
    queryKey: mode.kind === 'inbox' ? keys.resultsInbox : keys.patientResults(mode.patientId),
    queryFn: ({ signal }) =>
      mode.kind === 'inbox' ? repos.labs.inbox(signal) : repos.labs.patientResults(mode.patientId, signal),
    select: sortInbox,
  })
}

function useReviewActions(onDone: (warning: string | null) => void) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const refresh = (r: LabResult) =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.allResults }),
      client.invalidateQueries({ queryKey: keys.patientSummary(r.patientId) }),
    ])
  const acknowledge = useMutation({
    mutationFn: (input: { result: LabResult; release: boolean; comment: string }) => useCases.acknowledgeResult(input),
    onSuccess: async ({ value, warnings }) => {
      onDone(warnings.length > 0 ? t('clinical.results.releaseFailed') : null)
      await refresh(value)
    },
  })
  const release = useMutation({
    mutationFn: (input: { result: LabResult; comment: string }) => useCases.releaseResult(input),
    onSuccess: async ({ value }) => {
      onDone(null)
      await refresh(value)
    },
  })
  return { acknowledge, release }
}

/** C8: the inbox (ward-wide or one chart), the open result, and acknowledge and release. */
export function useResultsReview(mode: ReviewMode) {
  const { repos } = useServices()
  const keys = useKeys()
  const inbox = useInbox(mode)
  const { resultId } = useParams()
  const requested = resultId as LabResultId | undefined
  const openId = requested ?? inbox.data?.[0]?.id ?? null
  const result = useQuery({
    queryKey: keys.result(openId ?? ('' as LabResultId)),
    queryFn: ({ signal }) => repos.labs.result(openId ?? ('' as LabResultId), signal),
    enabled: openId !== null,
  })
  const [warning, setWarning] = useState<string | null>(null)
  const actions = useReviewActions(setWarning)
  const failure = actions.acknowledge.error ?? actions.release.error
  const error = failure ? errorMessage(errorCodeOf(failure)) : warning
  const busy = actions.acknowledge.isPending || actions.release.isPending
  return { inbox, openId, result, ...actions, busy, error }
}

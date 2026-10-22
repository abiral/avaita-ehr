import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { MedicationRequestId } from '@/core/branded'
import { errorCodeOf } from '@/core/errors'
import { firedChecks, isOpenRefill, type DecisionKind, type FiredCheck, type RefillRequest } from '@/domain/medications'
import { errorMessage, t } from '@/i18n'
import { useConfirm } from '@/ui'
import { formProblem, toDecision, type DecisionForm } from './decisionForm'

/** Open requests first; among them, those with a fired safety check, then the oldest. */
export const sortQueue = (requests: readonly RefillRequest[], now: Date): RefillRequest[] => {
  const rank = (r: RefillRequest) => (isOpenRefill(r.status) ? 0 : 2) + (firedChecks(r, now).length > 0 ? 0 : 1)
  return [...requests].sort((a, b) => rank(a) - rank(b) || a.requestedAt.getTime() - b.requestedAt.getTime())
}

/** Every decision is confirmed in a control that names the patient and MRN (section 1). */
function useDecisionConfirm() {
  const confirm = useConfirm()
  return (r: RefillRequest, kind: DecisionKind) =>
    confirm({
      title: t(`clinical.refills.decisionTitle.${kind}`),
      description: t('clinical.refills.decisionBody', { medication: r.medicationName }),
      confirmLabel: t(`clinical.refills.decisionConfirm.${kind}`, { patient: r.patientName, mrn: r.mrn }),
      cancelLabel: t('clinical.refills.confirmCancel'),
      ...(kind === 'decline' ? { tone: 'danger' as const } : {}),
    })
}

/** Asks again, naming every fired check and the patient, before an approval goes out. */
function useSecondConfirmation() {
  const confirm = useConfirm()
  return (r: RefillRequest, fired: readonly FiredCheck[]) =>
    confirm({
      title: t('clinical.refills.confirmTitle'),
      description: `${t('clinical.refills.confirmBody', { patient: r.patientName, mrn: r.mrn })} ${fired.map((f) => t(`clinical.refills.checkName.${f.id}`)).join(', ')}.`,
      confirmLabel: t('clinical.refills.confirmApprove', { patient: r.patientName, mrn: r.mrn }),
      cancelLabel: t('clinical.refills.confirmCancel'),
      tone: 'danger',
    })
}

/** C9: the queue, the open request, fired safety checks and the decision. */
export function useRefillQueue() {
  const { repos, useCases, clock } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const askAgain = useSecondConfirmation()
  const confirmDecision = useDecisionConfirm()
  const queue = useQuery({
    queryKey: keys.medicationRequests,
    queryFn: ({ signal }) => repos.medications.queue(signal),
  })
  const [chosen, setChosen] = useState<MedicationRequestId | null>(null)
  const [tried, setTried] = useState(false)
  const now = clock.now()
  const all = sortQueue(queue.data ?? [], now)
  const open = all.find((r) => r.id === chosen) ?? all.find((r) => isOpenRefill(r.status)) ?? all[0] ?? null
  const fired = open ? firedChecks(open, now) : []
  const decide = useMutation({
    mutationFn: (input: { request: RefillRequest; form: DecisionForm; acknowledged: readonly string[] }) =>
      useCases.decideRefill({ request: input.request, decision: toDecision(input.form, input.acknowledged) }),
    onSuccess: async ({ value }) => {
      setChosen(value.id)
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.medicationRequests }),
        client.invalidateQueries({ queryKey: keys.myMedications }),
      ])
    },
  })
  const submit = async (form: DecisionForm) => {
    setTried(true)
    if (!open || formProblem(form)) return
    const needsConfirm = form.kind === 'approve' && fired.length > 0
    const confirmed = needsConfirm ? await askAgain(open, fired) : await confirmDecision(open, form.kind)
    if (!confirmed) return
    decide.mutate({ request: open, form, acknowledged: needsConfirm ? fired.map((f) => f.id) : [] })
  }
  const select = (id: MedicationRequestId) => {
    setChosen(id)
    setTried(false)
    decide.reset()
  }
  const error = decide.error ? errorMessage(errorCodeOf(decide.error)) : null
  return { queue, all, open, fired, select, submit, busy: decide.isPending, error, tried }
}

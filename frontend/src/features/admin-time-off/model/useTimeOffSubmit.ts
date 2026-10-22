import { useQueryClient } from '@tanstack/react-query'
import { useReducer } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import { errorCodeOf } from '@/core/errors'
import { draftProblem, initialTimeOffForm, timeOffForm, type TimeOffDraft } from '@/domain/scheduling'
import type { NewTimeOff } from '@/domain/scheduling/types'
import { errorMessage, t } from '@/i18n'

const PROBLEM_TEXT = {
  'no-doctor': 'admin.leave.doctor',
  'end-before-start': 'admin.leave.endBeforeStart',
  'no-cover': 'admin.leave.chooseCover',
} as const

/** A2 flow: check impact, then save and refresh time off, slots and appointments. */
export function useTimeOffSubmit(draft: TimeOffDraft, ranges: readonly NewTimeOff[]) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  const [form, dispatch] = useReducer(timeOffForm, initialTimeOffForm)
  const fail = (e: unknown) => dispatch({ type: 'failed', error: errorMessage(errorCodeOf(e)) })
  const check = () => {
    const problem = draftProblem(draft)
    dispatch({ type: 'check' })
    if (problem) {
      dispatch({ type: 'failed', error: t(PROBLEM_TEXT[problem]) })
      return
    }
    useCases.previewTimeOff(ranges).then((r) => dispatch({ type: 'impact-loaded', impact: r.value }), fail)
  }
  const confirm = () => {
    dispatch({ type: 'confirm' })
    useCases.createTimeOff(ranges).then(async () => {
      dispatch({ type: 'saved' })
      await Promise.all(
        [keys.allTimeOff, keys.allSlots, keys.appointments.all].map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      )
    }, fail)
  }
  return { form, check, confirm, back: () => dispatch({ type: 'back' }), again: () => dispatch({ type: 'again' }) }
}

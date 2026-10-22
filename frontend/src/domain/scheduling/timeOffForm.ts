import { assertNever } from '@/core/assertNever'
import type { TimeOffImpact } from './types'

/** A2 form flow: editing -> checking -> previewing-impact -> saving -> saved. */
export type TimeOffFormState =
  | { readonly status: 'editing'; readonly error: string | null }
  | { readonly status: 'checking' }
  | { readonly status: 'previewing-impact'; readonly impact: TimeOffImpact }
  | { readonly status: 'saving'; readonly impact: TimeOffImpact }
  | { readonly status: 'saved'; readonly impact: TimeOffImpact }

export type TimeOffFormEvent =
  | { readonly type: 'check' }
  | { readonly type: 'impact-loaded'; readonly impact: TimeOffImpact }
  | { readonly type: 'failed'; readonly error: string }
  | { readonly type: 'back' }
  | { readonly type: 'confirm' }
  | { readonly type: 'saved' }
  | { readonly type: 'again' }

export const initialTimeOffForm: TimeOffFormState = { status: 'editing', error: null }

const onFailed = (s: TimeOffFormState, error: string): TimeOffFormState =>
  s.status === 'checking' || s.status === 'saving' ? { status: 'editing', error } : s
const onConfirm = (s: TimeOffFormState): TimeOffFormState =>
  s.status === 'previewing-impact' ? { status: 'saving', impact: s.impact } : s
const onSaved = (s: TimeOffFormState): TimeOffFormState =>
  s.status === 'saving' ? { status: 'saved', impact: s.impact } : s
const onImpact = (s: TimeOffFormState, impact: TimeOffImpact): TimeOffFormState =>
  s.status === 'checking' ? { status: 'previewing-impact', impact } : s
const when = (s: TimeOffFormState, from: TimeOffFormState['status'], to: TimeOffFormState): TimeOffFormState =>
  s.status === from ? to : s

export function timeOffForm(state: TimeOffFormState, event: TimeOffFormEvent): TimeOffFormState {
  switch (event.type) {
    case 'check':
      return when(state, 'editing', { status: 'checking' })
    case 'impact-loaded':
      return onImpact(state, event.impact)
    case 'failed':
      return onFailed(state, event.error)
    case 'back':
      return when(state, 'previewing-impact', initialTimeOffForm)
    case 'confirm':
      return onConfirm(state)
    case 'saved':
      return onSaved(state)
    case 'again':
      return when(state, 'saved', initialTimeOffForm)
    default:
      return assertNever(event)
  }
}

import { useEffect, useState, type SubmitEvent } from 'react'
import type { Registration, VerifiedRegistration } from '@/application/ports'
import { useServices } from '@/app/ServicesProvider'
import { ApiError, errorCodeOf } from '@/core/errors'
import { errorMessage } from '@/i18n'
import { EMPTY_DETAILS, resendLeft, type DetailsForm } from './form'

export type RegistrationStep =
  | { readonly step: 'details' }
  | { readonly step: 'verify'; readonly registration: Registration; readonly sentAt: Date }
  | { readonly step: 'done'; readonly verified: VerifiedRegistration }

const fieldsOf = (e: unknown): Record<string, string> => (e instanceof ApiError ? { ...e.fields } : {})

/** Re-renders every second while active (resend countdown). */
function useTicker(active: boolean): void {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setTick((n) => n + 1)
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [active])
}

function useStatus() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fail = (e: unknown) => {
    setFieldErrors(fieldsOf(e))
    setError(errorMessage(errorCodeOf(e)))
    setBusy(false)
  }
  const ok = () => {
    setFieldErrors({})
    setError(null)
    setBusy(false)
  }
  return { fieldErrors, error, setError, busy, setBusy, fail, ok }
}

/** Container hook for P2: details, then the mobile code, then done. */
export function useRegistration() {
  const { useCases, clock, sessionStore, repos } = useServices()
  const [flow, setFlow] = useState<RegistrationStep>({ step: 'details' })
  const [details, setDetails] = useState<DetailsForm>(EMPTY_DETAILS)
  const [code, setCode] = useState('')
  const status = useStatus()
  useTicker(flow.step === 'verify')
  const submitDetails = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    status.setBusy(true)
    useCases.register(details).then((r) => {
      setFlow({ step: 'verify', registration: r.value, sentAt: clock.now() })
      status.ok()
    }, status.fail)
  }
  const submitCode = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (flow.step !== 'verify') return
    status.setBusy(true)
    useCases.verifyRegistration({ id: flow.registration.id, code }).then((r) => {
      if (r.value.session) sessionStore.dispatch({ type: 'signed-in', session: r.value.session })
      setFlow({ step: 'done', verified: r.value.verified })
      status.ok()
    }, status.fail)
  }
  const resend = () => {
    if (flow.step !== 'verify') return
    repos.registration.resend(flow.registration.id).then(() => {
      setFlow({ ...flow, sentAt: clock.now() })
    }, status.fail)
  }
  const back = () => {
    setFlow({ step: 'details' })
    setCode('')
    status.setError(null)
  }
  const secondsLeft = flow.step === 'verify' ? resendLeft(flow.sentAt, clock.now()) : 0
  return { flow, details, setDetails, code, setCode, ...status, submitDetails, submitCode, resend, secondsLeft, back }
}

import { useState, type SubmitEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/routes'
import { useServices } from '@/app/ServicesProvider'
import { errorCodeOf } from '@/core/errors'
import { checkPassword, passwordOk } from '@/domain/identity'
import { errorMessage } from '@/i18n'

export type ResetStep = { readonly step: 1 } | { readonly step: 2; readonly masked: string } | { readonly step: 3 }

/** Container hook for P3: request link, check email, set a new password. A link with ?token= opens step 3. */
export function useResetScreen() {
  const { useCases } = useServices()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [flow, setFlow] = useState<ResetStep>(token ? { step: 3 } : { step: 1 })
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fail = (e: unknown) => {
    setError(errorMessage(errorCodeOf(e)))
    setBusy(false)
  }
  const request = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    useCases.requestPasswordReset(identifier).then((r) => {
      setFlow({ step: 2, masked: r.value.maskedDestination })
      setError(null)
      setBusy(false)
    }, fail)
  }
  const update = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    useCases.confirmPasswordReset({ token, password, confirm }).then(() => {
      void navigate(`${paths.login}?reset=done`, { replace: true })
    }, fail)
  }
  const rules = checkPassword(password, confirm)
  return {
    flow,
    identifier,
    setIdentifier,
    password,
    setPassword,
    confirm,
    setConfirm,
    rules,
    canUpdate: passwordOk(rules),
    error,
    busy,
    request,
    update,
    toStep3: () => {
      setFlow({ step: 3 })
    },
  }
}

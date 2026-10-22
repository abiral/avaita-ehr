import { useState, type SubmitEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useSession } from '@/app/session/SessionProvider'
import { errorCodeOf } from '@/core/errors'
import type { AccountKind } from '@/domain/identity'
import { errorMessage, t } from '@/i18n'
import { afterSignIn } from './target'

export interface SignInView {
  readonly kind: AccountKind
  readonly identifier: string
  readonly password: string
  readonly busy: boolean
  readonly error: string | null
  readonly fieldErrors: { readonly identifier?: string; readonly password?: string }
  readonly ssoNotice: boolean
  readonly notice: string | null
}

/** Container hook for P1: owns the form state and the sign-in call. */
export function useSignInScreen() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [view, setView] = useState<SignInView>({
    kind: 'patient',
    identifier: '',
    password: '',
    busy: false,
    error: null,
    fieldErrors: {},
    ssoNotice: false,
    notice: params.get('reset') === 'done' ? t('auth.reset.updated') : null,
  })
  const patch = (p: Partial<SignInView>) => {
    setView((v) => ({ ...v, ...p }))
  }
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const idLabel = view.kind === 'patient' ? t('auth.signIn.patientId') : t('auth.signIn.staffId')
    const fieldErrors = {
      ...(view.identifier.trim() ? {} : { identifier: t('auth.signIn.required', { field: idLabel.toLowerCase() }) }),
      ...(view.password
        ? {}
        : { password: t('auth.signIn.required', { field: t('auth.signIn.password').toLowerCase() }) }),
    }
    if (Object.keys(fieldErrors).length) {
      patch({ fieldErrors, error: null })
      return
    }
    patch({ busy: true, error: null, fieldErrors: {} })
    signIn({ kind: view.kind, identifier: view.identifier.trim(), password: view.password }).then(
      (session) => void navigate(afterSignIn(session, params.get('returnTo')), { replace: true }),
      (err: unknown) => {
        patch({ busy: false, error: errorMessage(errorCodeOf(err)), password: '' })
      },
    )
  }
  return {
    view,
    setKind: (kind: AccountKind) => {
      patch({ kind, error: null, fieldErrors: {}, ssoNotice: false })
    },
    setIdentifier: (identifier: string) => {
      patch({ identifier })
    },
    setPassword: (password: string) => {
      patch({ password })
    },
    showSso: () => {
      patch({ ssoNotice: true })
    },
    submit,
  }
}

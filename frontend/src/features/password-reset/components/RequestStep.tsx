import type { SubmitEvent } from 'react'
import { t } from '@/i18n'
import { AuthHeading, authSectionClass, Banner, Button, Field, TextInput } from '@/ui'

export interface RequestStepProps {
  readonly identifier: string
  readonly error: string | null
  readonly busy: boolean
  readonly onIdentifier: (v: string) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

export function RequestStep({ identifier, error, busy, onIdentifier, onSubmit }: RequestStepProps) {
  return (
    <form className={authSectionClass} onSubmit={onSubmit} noValidate aria-label={t('auth.reset.title')}>
      <AuthHeading title={t('auth.reset.title')} sub={t('auth.reset.sub')} />
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <Field label={t('auth.reset.identifier')}>
        {(c) => (
          <TextInput
            {...c}
            size="lg"
            autoComplete="username"
            value={identifier}
            onChange={(e) => onIdentifier(e.target.value)}
          />
        )}
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {t('auth.reset.send')}
      </Button>
    </form>
  )
}

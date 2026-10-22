import type { SubmitEvent } from 'react'
import { t } from '@/i18n'
import { AuthHeading, authSectionClass, Banner, Button } from '@/ui'
import styles from '../Registration.module.css'
import type { DetailsForm } from '../model/form'
import { ContactFields, fieldError, IdentityFields } from './DetailsFields'

export interface DetailsStepProps {
  readonly form: DetailsForm
  readonly org: string
  readonly errors: Readonly<Record<string, string>>
  readonly error: string | null
  readonly busy: boolean
  readonly onChange: (patch: Partial<DetailsForm>) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

/** P2 step 1: patient details with the proper autocomplete tokens. */
export function DetailsStep({ form, org, errors, error, busy, onChange, onSubmit }: DetailsStepProps) {
  return (
    <form className={authSectionClass} onSubmit={onSubmit} noValidate aria-label={t('auth.register.title')}>
      <AuthHeading title={t('auth.register.title')} sub={t('auth.register.sub', { org })} />
      {error && Object.keys(errors).length === 0 ? <Banner tone="critical">{error}</Banner> : null}
      <IdentityFields form={form} errors={errors} onChange={onChange} />
      <ContactFields form={form} errors={errors} onChange={onChange} />
      <Terms
        checked={form.acceptedTerms}
        error={fieldError(errors.acceptedTerms)}
        onChange={(acceptedTerms) => onChange({ acceptedTerms })}
      />
      <Button type="submit" variant="primary" size="lg" disabled={busy}>
        {t('auth.register.continue')}
      </Button>
    </form>
  )
}

function Terms({
  checked,
  error,
  onChange,
}: {
  readonly checked: boolean
  readonly error: string | undefined
  readonly onChange: (v: boolean) => void
}) {
  return (
    <div>
      <label className={styles.terms}>
        <input
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {t('auth.register.termsBefore')} <a href="/terms">{t('auth.register.terms')}</a> {t('auth.register.and')}{' '}
          <a href="/privacy">{t('auth.register.privacy')}</a>
          {t('auth.register.termsAfter')}
        </span>
      </label>
      <span className={styles.small} role="alert">
        {error}
      </span>
    </div>
  )
}

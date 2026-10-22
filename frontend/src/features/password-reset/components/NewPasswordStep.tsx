import type { SubmitEvent } from 'react'
import type { PasswordCheck } from '@/domain/identity'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { AuthHeading, authSectionClass, Banner, Button, Field, Icon, TextInput } from '@/ui'
import styles from '../Reset.module.css'

export interface NewPasswordStepProps {
  readonly password: string
  readonly confirm: string
  readonly rules: PasswordCheck
  readonly canUpdate: boolean
  readonly error: string | null
  readonly busy: boolean
  readonly onPassword: (v: string) => void
  readonly onConfirm: (v: string) => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

function Rule({ met, label }: { readonly met: boolean; readonly label: string }) {
  return (
    <li className={cx(styles.rule, met && styles.met)}>
      {met ? <Icon name="check" size={14} strokeWidth={2.2} /> : <span className={styles.dot} aria-hidden="true" />}
      {label}
      <span className="visually-hidden">, {met ? t('auth.reset.met') : t('auth.reset.notMet')}</span>
    </li>
  )
}

/** P3 step 3: new password with live rule checks (text, not color alone). */
export function NewPasswordStep(props: NewPasswordStepProps) {
  const { password, confirm, rules, canUpdate, error, busy } = props
  return (
    <form className={authSectionClass} onSubmit={props.onSubmit} noValidate aria-label={t('auth.reset.newTitle')}>
      <AuthHeading title={t('auth.reset.newTitle')} sub={t('auth.reset.newSub')} />
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <Field label={t('auth.reset.newPassword')}>
        {(c) => (
          <TextInput
            {...c}
            size="lg"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => props.onPassword(e.target.value)}
          />
        )}
      </Field>
      <Field label={t('auth.reset.confirmPassword')}>
        {(c) => (
          <TextInput
            {...c}
            size="lg"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => props.onConfirm(e.target.value)}
          />
        )}
      </Field>
      <ul className={styles.rules} aria-label={t('auth.reset.rules')} aria-live="polite">
        <Rule met={rules.length} label={t('auth.reset.ruleLength')} />
        <Rule met={rules.number} label={t('auth.reset.ruleNumber')} />
        <Rule met={rules.match} label={t('auth.reset.ruleMatch')} />
      </ul>
      <Button type="submit" variant="primary" size="lg" disabled={busy || !canUpdate}>
        {t('auth.reset.update')}
      </Button>
    </form>
  )
}

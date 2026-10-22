import type { SubmitEvent } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { AccountKind } from '@/domain/identity'
import { t } from '@/i18n'
import { AuthCard, AuthHeading, Banner, Button, Icon, SegmentedControl } from '@/ui'
import styles from '../Auth.module.css'
import type { SignInView } from '../model/useSignInScreen'
import { CredentialFields } from './CredentialFields'

export interface SignInFormProps {
  readonly view: SignInView
  readonly org: string
  readonly onKind: (kind: AccountKind) => void
  readonly onIdentifier: (v: string) => void
  readonly onPassword: (v: string) => void
  readonly onSso: () => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

/** P1 sign in: Patient or Staff toggle, credentials, SSO for staff, registration link for patients. */
export function SignInForm({ view, org, onKind, onIdentifier, onPassword, onSso, onSubmit }: SignInFormProps) {
  const patient = view.kind === 'patient'
  return (
    <AuthCard as="form" onSubmit={onSubmit} label={t('auth.signIn.submit')}>
      <AuthHeading
        title={t('auth.signIn.title', { org })}
        sub={patient ? t('auth.signIn.patientSub') : t('auth.signIn.staffSub')}
      />
      <SegmentedControl
        label={t('auth.signIn.accountType')}
        value={view.kind}
        size="lg"
        onChange={onKind}
        options={[
          { value: 'patient', label: t('auth.signIn.patient') },
          { value: 'staff', label: t('auth.signIn.staff') },
        ]}
      />
      {view.notice ? <Banner tone="info">{view.notice}</Banner> : null}
      {view.error ? <Banner tone="critical">{view.error}</Banner> : null}
      <CredentialFields view={view} onIdentifier={onIdentifier} onPassword={onPassword} />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" block disabled={view.busy}>
          {view.busy ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
        </Button>
        {patient ? null : (
          <Button size="lg" block onClick={onSso}>
            <Icon name="lock" size={16} strokeWidth={1.6} />
            {t('auth.signIn.sso')}
          </Button>
        )}
        {view.ssoNotice ? <Banner tone="neutral">{t('auth.signIn.ssoUnavailable')}</Banner> : null}
      </div>
      {patient ? (
        <p className={styles.newHere}>
          {t('auth.signIn.newHere', { org: org.split(' ')[0] ?? org })}{' '}
          <Link to={paths.register}>{t('auth.signIn.createAccount')}</Link>
        </p>
      ) : null}
    </AuthCard>
  )
}

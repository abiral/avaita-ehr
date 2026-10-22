import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { TextField } from '@/ui'
import styles from '../Auth.module.css'
import type { SignInView } from '../model/useSignInScreen'

export interface CredentialFieldsProps {
  readonly view: SignInView
  readonly onIdentifier: (v: string) => void
  readonly onPassword: (v: string) => void
}

export function CredentialFields({ view, onIdentifier, onPassword }: CredentialFieldsProps) {
  return (
    <div className={styles.fields}>
      <TextField
        label={view.kind === 'patient' ? t('auth.signIn.patientId') : t('auth.signIn.staffId')}
        error={view.fieldErrors.identifier}
        size="lg"
        autoComplete="username"
        value={view.identifier}
        onValue={onIdentifier}
      />
      <TextField
        label={t('auth.signIn.password')}
        error={view.fieldErrors.password}
        size="lg"
        type="password"
        autoComplete="current-password"
        value={view.password}
        onValue={onPassword}
        aside={
          <Link to={paths.forgotPassword} className={styles.forgot}>
            {t('auth.signIn.forgot')}
          </Link>
        }
      />
    </div>
  )
}

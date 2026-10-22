import { branding } from '@/app/branding'
import { t } from '@/i18n'
import { AuthFooter } from '@/ui'
import styles from './Auth.module.css'
import { SignInForm } from './components/SignInForm'
import { useSignInScreen } from './model/useSignInScreen'

function DemoAccounts() {
  if (import.meta.env.VITE_API_MOCK !== 'true') return null
  return (
    <p className={styles.demo}>
      <span className={styles.demoTitle}>{t('auth.signIn.demoTitle')}</span>
      {t('auth.signIn.demoBody')}
    </p>
  )
}

/** P1: sign in for patients and staff. */
export function SignInScreen() {
  const s = useSignInScreen()
  return (
    <>
      <SignInForm
        view={s.view}
        org={branding.organizationName}
        onKind={s.setKind}
        onIdentifier={s.setIdentifier}
        onPassword={s.setPassword}
        onSso={s.showSso}
        onSubmit={s.submit}
      />
      <AuthFooter />
      <DemoAccounts />
    </>
  )
}

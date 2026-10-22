import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { AuthCard, authBackClass, Icon } from '@/ui'
import { CheckStep } from './components/CheckStep'
import { NewPasswordStep } from './components/NewPasswordStep'
import { RequestStep } from './components/RequestStep'
import { useResetScreen } from './model/useResetScreen'
import styles from './Reset.module.css'

/** P3: forgot password in three steps. */
export function PasswordResetScreen() {
  const r = useResetScreen()
  const { flow } = r
  return (
    <>
      <AuthCard width={420}>
        <span className={styles.step}>{t('auth.reset.step', { n: flow.step })}</span>
        {flow.step === 1 ? (
          <RequestStep
            identifier={r.identifier}
            error={r.error}
            busy={r.busy}
            onIdentifier={r.setIdentifier}
            onSubmit={r.request}
          />
        ) : null}
        {flow.step === 2 ? <CheckStep masked={flow.masked} onHaveLink={r.toStep3} /> : null}
        {flow.step === 3 ? (
          <NewPasswordStep
            password={r.password}
            confirm={r.confirm}
            rules={r.rules}
            canUpdate={r.canUpdate}
            error={r.error}
            busy={r.busy}
            onPassword={r.setPassword}
            onConfirm={r.setConfirm}
            onSubmit={r.update}
          />
        ) : null}
      </AuthCard>
      <Link to={paths.login} className={authBackClass}>
        <Icon name="chevronLeft" size={14} strokeWidth={1.8} />
        {t('auth.reset.backToSignIn')}
      </Link>
    </>
  )
}

import { Link } from 'react-router'
import { branding } from '@/app/branding'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { AuthBelow, AuthCard } from '@/ui'
import { DetailsStep } from './components/DetailsStep'
import { DoneStep } from './components/DoneStep'
import { Progress } from './components/Progress'
import { VerifyStep } from './components/VerifyStep'
import { useRegistration } from './model/useRegistration'

/** P2: create a patient account in three steps. */
export function RegistrationScreen() {
  const r = useRegistration()
  const { flow } = r
  return (
    <>
      <AuthCard width={520}>
        <Progress current={flow.step} />
        {flow.step === 'details' ? (
          <DetailsStep
            form={r.details}
            org={branding.shortName}
            errors={r.fieldErrors}
            error={r.error}
            busy={r.busy}
            onChange={(patch) => r.setDetails((d) => ({ ...d, ...patch }))}
            onSubmit={r.submitDetails}
          />
        ) : null}
        {flow.step === 'verify' ? (
          <VerifyStep
            maskedMobile={flow.registration.maskedMobile}
            code={r.code}
            error={r.error}
            busy={r.busy}
            secondsLeft={r.secondsLeft}
            onCode={r.setCode}
            onResend={r.resend}
            onBack={r.back}
            onSubmit={r.submitCode}
          />
        ) : null}
        {flow.step === 'done' ? <DoneStep verified={flow.verified} /> : null}
      </AuthCard>
      {flow.step === 'done' ? null : (
        <AuthBelow>
          {t('auth.register.haveAccount')} <Link to={paths.login}>{t('auth.register.signIn')}</Link>
        </AuthBelow>
      )}
    </>
  )
}

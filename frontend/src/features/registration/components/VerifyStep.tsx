import type { SubmitEvent } from 'react'
import { t } from '@/i18n'
import { AuthHeading, authSectionClass, Banner, Button, CodeInput, TextAction } from '@/ui'
import styles from '../Registration.module.css'
import { CODE_LENGTH, formatCountdown } from '../model/form'

export interface VerifyStepProps {
  readonly maskedMobile: string
  readonly code: string
  readonly error: string | null
  readonly busy: boolean
  readonly secondsLeft: number
  readonly onCode: (code: string) => void
  readonly onResend: () => void
  readonly onBack: () => void
  readonly onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
}

/** P2 step 2: the 6-digit code sent by SMS, with a resend countdown. */
export function VerifyStep(props: VerifyStepProps) {
  const { maskedMobile, code, error, busy, secondsLeft } = props
  return (
    <form className={authSectionClass} onSubmit={props.onSubmit} noValidate aria-label={t('auth.register.verifyTitle')}>
      <AuthHeading
        title={t('auth.register.verifyTitle')}
        sub={t('auth.register.verifySub', { mobile: maskedMobile })}
      />
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <CodeInput
        value={code}
        onChange={props.onCode}
        length={CODE_LENGTH}
        groupLabel={t('auth.register.codeGroup')}
        digitLabel={(n) => t('auth.register.digit', { n })}
        invalid={Boolean(error)}
      />
      <p className={styles.small}>
        {t('auth.register.resendPrompt')}{' '}
        {secondsLeft > 0 ? (
          <span>
            {t('auth.register.resend')} {t('auth.register.resendIn')}{' '}
            <span className="mono">{formatCountdown(secondsLeft)}</span>
          </span>
        ) : (
          <TextAction onClick={props.onResend}>{t('auth.register.resend')}</TextAction>
        )}
      </p>
      <div className={styles.buttons}>
        <Button size="lg" onClick={props.onBack}>
          {t('auth.register.back')}
        </Button>
        <span className={styles.grow}>
          <Button type="submit" variant="primary" size="lg" block disabled={busy || code.length < CODE_LENGTH}>
            {t('auth.register.verify')}
          </Button>
        </span>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { t } from '@/i18n'
import { AuthHeading, authIconClass, authSectionClass, Button, Icon, TextAction } from '@/ui'
import styles from '../Reset.module.css'

export function CheckStep({ masked, onHaveLink }: { readonly masked: string; readonly onHaveLink: () => void }) {
  const [sms, setSms] = useState(false)
  return (
    <div className={authSectionClass}>
      <span className={authIconClass}>
        <Icon name="mail" size={22} />
      </span>
      <AuthHeading
        title={t('auth.reset.checkTitle')}
        sub={
          <>
            {t('auth.reset.checkBefore')} <strong className={styles.strong}>{masked}</strong>
            {t('auth.reset.checkAfter')}
          </>
        }
      />
      <Button variant="primary" size="lg" onClick={onHaveLink}>
        {t('auth.reset.haveLink')}
      </Button>
      <p className={styles.small} aria-live="polite">
        {sms ? (
          t('auth.reset.sentBySms')
        ) : (
          <>
            {t('auth.reset.nothing')} <TextAction onClick={() => setSms(true)}>{t('auth.reset.bySms')}</TextAction>.
          </>
        )}
      </p>
    </div>
  )
}

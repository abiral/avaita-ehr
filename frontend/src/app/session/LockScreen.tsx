import { useState, type SubmitEvent } from 'react'
import { errorCodeOf } from '@/core/errors'
import type { Session } from '@/domain/identity'
import { errorMessage, t } from '@/i18n'
import { Button, Field, Modal, TextAction, TextInput } from '@/ui'
import styles from './LockScreen.module.css'

export interface LockScreenProps {
  readonly session: Session
  readonly onUnlock: (password: string) => Promise<void>
  readonly onSignOut: () => void
}

/** Keeps the URL and the mounted screen (drafts stay in memory); asks for the password again. */
export function LockScreen({ session, onUnlock, onSignOut }: LockScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    onUnlock(password).then(
      () => {
        setPassword('')
      },
      (err: unknown) => {
        setError(errorMessage(errorCodeOf(err)))
        setBusy(false)
      },
    )
  }
  return (
    <Modal
      role="alertdialog"
      title={t('common.lock.title')}
      description={session.kind === 'staff' ? t('common.lock.staffBody') : t('common.lock.patientBody')}
      closeLabel={t('common.lock.signInAsSomeoneElse')}
      onClose={onSignOut}
    >
      <form onSubmit={submit} className={styles.form}>
        <span>{t('common.lock.signedInAs', { name: session.displayName })}</span>
        <Field label={t('common.lock.password')} error={error}>
          {(c) => (
            <TextInput
              {...c}
              type="password"
              size="lg"
              autoComplete="current-password"
              value={password}
              data-autofocus
              onChange={(e) => {
                setPassword(e.target.value)
              }}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="lg" disabled={busy}>
          {t('common.lock.unlock')}
        </Button>
        <TextAction onClick={onSignOut}>{t('common.lock.signInAsSomeoneElse')}</TextAction>
      </form>
    </Modal>
  )
}

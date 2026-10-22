import { t } from '@/i18n'
import { Card, Field, Textarea } from '@/ui'
import styles from '../Booking.module.css'

export interface ConfirmStepProps {
  readonly reason: string
  readonly remote: boolean
  readonly cutoffHours: number
  readonly onReason: (reason: string) => void
}

/** P5 step 4: reason, reminders and the cancellation rule. */
export function ConfirmStep({ reason, remote, cutoffHours, onReason }: ConfirmStepProps) {
  return (
    <Card className={styles.panel}>
      <h2 className={styles.panelTitle}>{t('portal.booking.confirmTitle')}</h2>
      <Field label={t('portal.booking.reason')} hint={t('portal.booking.reasonHint')}>
        {(c) => <Textarea {...c} rows={3} value={reason} onChange={(e) => onReason(e.target.value)} />}
      </Field>
      <label className={styles.check}>
        <input type="checkbox" defaultChecked />
        {t('portal.booking.shareLabs')}
      </label>
      {remote ? <p className={styles.info}>{t('portal.booking.remoteInfo')}</p> : null}
      <p className={styles.small}>{t('portal.booking.freeCancel', { hours: cutoffHours })}</p>
    </Card>
  )
}

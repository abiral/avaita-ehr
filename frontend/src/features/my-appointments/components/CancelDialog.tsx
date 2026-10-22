import { useState } from 'react'
import { CANCEL_REASONS, type Appointment, type CancelReason } from '@/domain/appointments'
import { t } from '@/i18n'
import { Button, Modal, Radio } from '@/ui'
import { whenLine } from '../model/labels'
import styles from '../MyAppointments.module.css'

export interface CancelDialogProps {
  readonly appointment: Appointment
  readonly cutoffHours: number
  readonly timeZone: string
  readonly busy: boolean
  readonly onKeep: () => void
  readonly onCancel: (reason: CancelReason) => void
}

/** P7 cancel dialog with reason radios and the cancellation window rule. */
export function CancelDialog({ appointment, cutoffHours, timeZone, busy, onKeep, onCancel }: CancelDialogProps) {
  const [reason, setReason] = useState<CancelReason>('feeling-better')
  return (
    <Modal
      title={t('portal.appointments.dialogTitle')}
      description={`${appointment.title} · ${whenLine(appointment, timeZone)}`}
      closeLabel={t('portal.appointments.keep')}
      onClose={onKeep}
      footer={
        <>
          <Button size="lg" onClick={onKeep} data-autofocus>
            {t('portal.appointments.keep')}
          </Button>
          <Button size="lg" variant="danger" disabled={busy} onClick={() => onCancel(reason)}>
            {t('portal.appointments.confirmCancel')}
          </Button>
        </>
      }
    >
      <fieldset className={styles.reasons}>
        <legend className={styles.legend}>{t('portal.appointments.reasonLegend')}</legend>
        {CANCEL_REASONS.map((r) => (
          <Radio
            key={r}
            name="cancel-reason"
            checked={reason === r}
            onChange={() => setReason(r)}
            label={t(`portal.appointments.reasons.${r}`)}
          />
        ))}
      </fieldset>
      <p className={styles.rule}>{t('portal.appointments.noCharge', { hours: cutoffHours })}</p>
    </Modal>
  )
}

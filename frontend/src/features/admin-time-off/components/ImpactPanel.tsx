import type { Practitioner, TimeOffImpact } from '@/domain/scheduling/types'
import type { TimeOffDraft } from '@/domain/scheduling/timeOffRange'
import { formatTime, t } from '@/i18n'
import { Button } from '@/ui'
import { shortDay } from '../model/labels'
import styles from '../TimeOff.module.css'

export interface ImpactPanelProps {
  readonly impact: TimeOffImpact
  readonly draft: TimeOffDraft
  readonly range: string
  readonly doctors: readonly Practitioner[]
  readonly timeZone: string
  readonly busy: boolean
  readonly onBack: () => void
  readonly onConfirm: () => void
}

const confirmLabel = (draft: TimeOffDraft, count: number): string => {
  if (count === 0 || draft.handling === 'keep') return t('admin.leave.confirmBlock')
  return draft.handling === 'notify'
    ? t('admin.leave.confirmNotify', { count })
    : t('admin.leave.confirmReassign', { count })
}

/** A2: affected appointments are listed before saving. */
export function ImpactPanel({ impact, draft, range, doctors, timeZone, busy, onBack, onConfirm }: ImpactPanelProps) {
  const count = impact.affected.length
  const cover = doctors.find((d) => d.id === draft.coverPractitionerId)?.displayName ?? ''
  const explain = {
    notify: t('admin.leave.explainNotify'),
    reassign: t('admin.leave.explainReassign', { doctor: cover }),
    keep: t('admin.leave.explainKeep'),
  }[draft.handling]
  return (
    <div className={styles.stack}>
      <div className={styles.warn} role="status">
        {count
          ? t('admin.leave.impact', { count, range, slots: impact.removedSlots })
          : t('admin.leave.impactNone', { range, slots: impact.removedSlots })}
      </div>
      {count ? (
        <ul className={styles.affected} aria-label={t('admin.leave.affected')}>
          {impact.affected.map((a) => (
            <li key={a.appointmentId}>
              <span>{a.patientName}</span>
              <span className={`mono ${styles.time ?? ''}`}>
                {shortDay(a.start, timeZone)} {formatTime(a.start, timeZone)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {count ? <span className={styles.explain}>{explain}</span> : null}
      <div className={styles.buttons}>
        <Button onClick={onBack}>{t('admin.leave.back')}</Button>
        <Button variant="primary" disabled={busy} onClick={onConfirm}>
          {confirmLabel(draft, count)}
        </Button>
      </div>
    </div>
  )
}

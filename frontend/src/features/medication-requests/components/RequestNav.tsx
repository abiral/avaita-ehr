import type { MedicationRequestId } from '@/core/branded'
import { isOpenRefill, type RefillRequest } from '@/domain/medications'
import { formatShortDate, formatTime, t } from '@/i18n'
import { Card, Tag, type TagTone } from '@/ui'
import styles from '../Requests.module.css'
import { requestState } from '../model/requestState'

export interface RequestNavProps {
  readonly requests: readonly RefillRequest[]
  readonly openId: MedicationRequestId | null
  readonly timeZone: string
  readonly onSelect: (id: MedicationRequestId) => void
}

export const STATE_TONE: Readonly<Record<ReturnType<typeof requestState>, TagTone>> = {
  pending: 'neutral',
  approved: 'info',
  changed: 'info',
  declined: 'alert',
  ready: 'info',
  delivered: 'info',
}

/** Requests from the patient portal; each tag says its state in words. */
export function RequestNav({ requests, openId, timeZone, onSelect }: RequestNavProps) {
  return (
    <Card className={styles.nav}>
      <nav aria-label={t('clinical.refills.list')}>
        <div className={styles.navHead}>
          <span className="cap">{t('clinical.refills.fromPortal')}</span>
          <span className={styles.count}>
            {t('clinical.refills.pending', { count: requests.filter((r) => isOpenRefill(r.status)).length })}
          </span>
        </div>
        <ul className={styles.list}>
          {requests.map((r) => {
            const state = requestState(r.status)
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.rq}
                  aria-pressed={r.id === openId}
                  onClick={() => onSelect(r.id)}
                >
                  <span className={styles.rqRow}>
                    <span className={styles.who}>{r.patientName}</span>
                    <span className={styles.when}>
                      {formatShortDate(r.requestedAt, timeZone)}, {formatTime(r.requestedAt, timeZone)}
                    </span>
                  </span>
                  <span className={styles.rqRow}>
                    <span className={styles.med}>{r.medicationName}</span>
                    <Tag tone={STATE_TONE[state]}>{t(`clinical.refills.state.${state}`)}</Tag>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </Card>
  )
}

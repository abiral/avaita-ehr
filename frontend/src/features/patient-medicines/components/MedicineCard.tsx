import type { Medication } from '@/domain/medications'
import { refillStep } from '@/domain/medications'
import { formatShortDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Button, Card, Tag } from '@/ui'
import styles from '../Medicines.module.css'
import { canRequest, LOW_SUPPLY_DAYS, medicineState, STATE_TONE, supplyPercent } from '../model/medicineView'

function Progress({ m, timeZone }: { readonly m: Medication; readonly timeZone: string }) {
  const request = m.openRequest
  if (!request) return null
  const decided = refillStep(request.status) === 3
  const ready = request.status === 'ready-for-pickup' || request.status === 'delivered'
  return (
    <ol className={styles.progress} aria-label={t('portal.medicines.progress')}>
      <li className={cx(styles.step, styles.stepDone)}>
        {t('portal.medicines.steps.requested', { date: formatShortDate(request.requestedAt, timeZone) })}
      </li>
      <li
        className={cx(styles.step, decided ? styles.stepDone : styles.stepCurrent)}
        aria-current={decided ? undefined : 'step'}
      >
        {t('portal.medicines.steps.reviewing')}
      </li>
      <li className={cx(styles.step, decided && styles.stepDone)} aria-current={decided ? 'step' : undefined}>
        {decided && !ready ? t('portal.medicines.steps.decided') : t('portal.medicines.steps.ready')}
      </li>
    </ol>
  )
}

export interface MedicineCardProps {
  readonly m: Medication
  readonly selected: boolean
  readonly timeZone: string
  readonly onRequest: () => void
}

/** One current medicine: how to take it, supply left, refill button and refill progress. */
export function MedicineCard({ m, selected, timeZone, onRequest }: MedicineCardProps) {
  const state = medicineState(m)
  const low = m.daysLeft <= LOW_SUPPLY_DAYS
  const requestable = canRequest(m)
  return (
    <Card as="article" className={styles.med} labelledBy={`med-${m.id}`}>
      <div className={styles.medTop}>
        <div className={styles.medText}>
          <h2 id={`med-${m.id}`} className={styles.medName}>
            {m.name}
          </h2>
          <span className={styles.how}>{m.instructions}</span>
          <span className={styles.why}>{m.indication}</span>
        </div>
        <Tag tone={STATE_TONE[state]}>{t(`portal.medicines.status.${state}`)}</Tag>
      </div>
      <div className={styles.supplyRow}>
        <div className={styles.supply}>
          <span className={styles.supplyHead}>
            <span>{t('portal.medicines.supplyLeft')}</span>
            <span className={styles.mono}>{t('portal.medicines.daysLeft', { days: m.daysLeft })}</span>
          </span>
          <span
            className={styles.track}
            role="img"
            aria-label={t('portal.medicines.supplyAria', { days: m.daysLeft, total: m.supplyDays })}
          >
            <span
              className={cx(styles.fill, low && styles.fillLow)}
              style={{ width: `${String(supplyPercent(m))}%` }}
            />
          </span>
        </div>
        <Button
          variant={selected && requestable ? 'primary' : 'secondary'}
          disabled={!requestable}
          aria-label={requestable ? t('portal.medicines.requestFor', { name: m.name }) : undefined}
          onClick={onRequest}
        >
          {requestable ? t('portal.medicines.request') : t('portal.medicines.requested')}
        </Button>
      </div>
      <Progress m={m} timeZone={timeZone} />
    </Card>
  )
}

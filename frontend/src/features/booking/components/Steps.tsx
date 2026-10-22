import { cx } from '@/shared/cx'
import { t } from '@/i18n'
import styles from '../Booking.module.css'

const LABELS = ['search', 'mode', 'slot', 'confirm'] as const

/** Four-step progress bars ("01 Find a doctor"). */
export function Steps({ current }: { readonly current: number }) {
  return (
    <ol className={styles.steps} aria-label={t('portal.booking.steps')}>
      {LABELS.map((key, i) => (
        <li
          key={key}
          className={cx(styles.step, i <= current && styles.reached)}
          aria-current={i === current ? 'step' : undefined}
        >
          <span>
            <span className="mono">{`0${String(i + 1)}`}</span> {t(`portal.booking.stepLabels.${key}`)}
          </span>
        </li>
      ))}
    </ol>
  )
}

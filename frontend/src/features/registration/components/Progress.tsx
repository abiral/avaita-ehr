import { cx } from '@/shared/cx'
import { t } from '@/i18n'
import styles from '../Registration.module.css'

const STEPS = ['details', 'verify', 'done'] as const

export function Progress({ current }: { readonly current: (typeof STEPS)[number] }) {
  const index = STEPS.indexOf(current)
  return (
    <ol className={styles.progress} aria-label={t('auth.register.progress')}>
      {STEPS.map((s, i) => (
        <li
          key={s}
          className={cx(styles.progressItem, i <= index && styles.reached)}
          aria-current={i === index ? 'step' : undefined}
        >
          {t(`auth.register.steps.${s}`)}
        </li>
      ))}
    </ol>
  )
}

import { cx } from '@/shared/cx'
import styles from './Choice.module.css'

export interface ChipProps {
  readonly label: string
  readonly selected: boolean
  readonly onToggle: () => void
  readonly count?: number
  readonly size?: 'md' | 'lg'
}

/** Filter chip with an optional count, exposed as a toggle button. */
export function Chip({ label, selected, onToggle, count, size = 'md' }: ChipProps) {
  return (
    <button
      type="button"
      className={cx(styles.chip, size === 'lg' && styles.chipLg)}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {label}
      {count === undefined ? null : ' '}
      {count === undefined ? null : <span className={styles.count}>{count}</span>}
    </button>
  )
}

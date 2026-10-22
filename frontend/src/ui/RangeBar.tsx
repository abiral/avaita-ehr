import { cx } from '@/shared/cx'
import styles from './Charts.module.css'

export interface RangeBarProps {
  readonly value: number
  readonly low: number
  readonly high: number
  /** Text alternative, for example "Potassium 5.3 mmol/L, high". */
  readonly label: string
  readonly rangeText: string
}

/** Normal range is drawn as the middle half of the track; the marker is clamped to stay visible. */
export const rangePosition = (value: number, low: number, high: number): number => {
  const span = high - low || 1
  return Math.max(3, Math.min(97, 25 + (50 * (value - low)) / span))
}

export function RangeBar({ value, low, high, label, rangeText }: RangeBarProps) {
  const out = value < low || value > high
  return (
    <span className={cx(styles.range, out && styles.out)}>
      <span className={styles.track} role="img" aria-label={label}>
        <span className={styles.normal} />
        <span className={styles.marker} style={{ left: `${rangePosition(value, low, high)}%` }} />
      </span>
      <span className={styles.rangeText}>{rangeText}</span>
    </span>
  )
}

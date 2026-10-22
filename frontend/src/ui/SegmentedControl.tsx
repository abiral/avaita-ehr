import { cx } from '@/shared/cx'
import styles from './Choice.module.css'

export interface SegmentOption<V extends string> {
  readonly value: V
  readonly label: string
  readonly disabled?: boolean
}

export interface SegmentedControlProps<V extends string> {
  readonly label: string
  readonly value: V
  readonly options: readonly SegmentOption<V>[]
  readonly onChange: (value: V) => void
  readonly inline?: boolean
  readonly size?: 'md' | 'lg'
}

export function SegmentedControl<V extends string>(props: SegmentedControlProps<V>) {
  const { label, value, options, onChange, inline = false, size = 'md' } = props
  return (
    <div
      className={cx(styles.seg, inline && styles.inline, size === 'lg' && styles.lg)}
      role="group"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={o.disabled}
          onClick={() => {
            onChange(o.value)
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

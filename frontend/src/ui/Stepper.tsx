import { cx } from '@/shared/cx'
import styles from './Stepper.module.css'
import { Icon } from './icons/Icon'

export interface StepperProps {
  readonly label: string
  readonly steps: readonly string[]
  /** Zero-based index of the current step. */
  readonly current: number
}

export function Stepper({ label, steps, current }: StepperProps) {
  return (
    <ol className={styles.stepper} aria-label={label}>
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li
            key={step}
            className={cx(styles.step, styles[state])}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.dot}>
              {state === 'done' ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
            </span>
            {step}
          </li>
        )
      })}
    </ol>
  )
}

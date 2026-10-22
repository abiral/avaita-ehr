import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Form.module.css'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  readonly label: ReactNode
  readonly hint?: ReactNode
}

/** Bordered radio card, as used in dialogs and handling choices. */
export function Radio({ label, hint, ...rest }: RadioProps) {
  return (
    <label className={styles.radio}>
      <input type="radio" {...rest} />
      <span className={styles.radioText}>
        <span>{label}</span>
        {hint ? <span className={styles.radioHint}>{hint}</span> : null}
      </span>
    </label>
  )
}

import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Form.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  readonly label: ReactNode
}

export function Checkbox({ label, ...rest }: CheckboxProps) {
  return (
    <label className={styles.check}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  )
}

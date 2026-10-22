import type { SelectHTMLAttributes } from 'react'
import { cx } from '@/shared/cx'
import styles from './Form.module.css'

export interface SelectOption {
  readonly value: string
  readonly label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'size' | 'children'> {
  readonly options: readonly SelectOption[]
  readonly size?: 'sm' | 'md' | 'lg'
}

export function Select({ options, size = 'md', ...rest }: SelectProps) {
  return (
    <select className={cx(styles.control, size !== 'md' && styles[size])} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

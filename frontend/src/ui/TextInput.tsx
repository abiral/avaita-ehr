import { forwardRef, type InputHTMLAttributes } from 'react'
import { cx } from '@/shared/cx'
import styles from './Form.module.css'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  readonly size?: 'sm' | 'md' | 'lg'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { size = 'md', type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cx(styles.control, size !== 'md' && styles[size])} {...rest} />
})

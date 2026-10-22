import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly block?: boolean
  readonly children: ReactNode
}

export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', block = false): string =>
  cx(styles.btn, variant !== 'secondary' && styles[variant], size !== 'md' && styles[size], block && styles.block)

export function Button({ variant, size, block, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, block)} {...rest}>
      {children}
    </button>
  )
}

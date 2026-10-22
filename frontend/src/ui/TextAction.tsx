import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export interface TextActionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly children: ReactNode
}

/** A link-styled button for inline actions (never an anchor without a destination). */
export function TextAction({ children, type = 'button', ...rest }: TextActionProps) {
  return (
    <button type={type} className={styles.textAction} {...rest}>
      {children}
    </button>
  )
}

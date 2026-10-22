import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'

export interface ButtonLinkProps {
  readonly to: string
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly block?: boolean
  readonly children: ReactNode
}

/** Navigation styled as a button. Use Button for actions. */
export function ButtonLink({ to, variant, size, block, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonClass(variant, size, block)}>
      {children}
    </Link>
  )
}

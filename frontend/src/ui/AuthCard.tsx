import type { ReactNode, SubmitEvent } from 'react'
import { cx } from '@/shared/cx'
import styles from './AuthCard.module.css'

export interface AuthCardProps {
  readonly width?: 400 | 420 | 520
  readonly children: ReactNode
  readonly as?: 'div' | 'form'
  readonly onSubmit?: (e: SubmitEvent<HTMLFormElement>) => void
  readonly label?: string
}

/** The centered card used by sign in, registration and password reset. */
export function AuthCard({ width = 400, children, as = 'div', onSubmit, label }: AuthCardProps) {
  const className = cx(styles.card, width !== 400 && styles[`w${width}`])
  if (as === 'form') {
    return (
      <form className={className} onSubmit={onSubmit} aria-label={label} noValidate>
        {children}
      </form>
    )
  }
  return <div className={className}>{children}</div>
}

export function AuthHeading({ title, sub }: { readonly title: string; readonly sub?: ReactNode }) {
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>{title}</h1>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
    </div>
  )
}

export const authSectionClass = styles.section ?? ''
export const authIconClass = styles.icon ?? ''

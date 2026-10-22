import type { ReactNode } from 'react'
import styles from './Card.module.css'

export interface CardHeaderProps {
  readonly id: string
  readonly title: string
  readonly sub?: string | undefined
  readonly action?: ReactNode
  readonly level?: 2 | 3
}

export function CardHeader({ id, title, sub, action, level = 2 }: CardHeaderProps) {
  const H = level === 2 ? 'h2' : 'h3'
  return (
    <div className={styles.header}>
      <div className={styles.stack}>
        <H id={id} className={styles.title}>
          {title}
        </H>
        {sub ? <span className={styles.sub}>{sub}</span> : null}
      </div>
      {action}
    </div>
  )
}

import type { ReactNode } from 'react'
import styles from './Misc.module.css'

export interface EmptyStateProps {
  readonly title: string
  readonly body?: string
  readonly action?: ReactNode
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyTitle}>{title}</span>
      {body ? <span>{body}</span> : null}
      {action}
    </div>
  )
}

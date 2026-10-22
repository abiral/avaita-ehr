import type { ReactNode } from 'react'
import styles from './Misc.module.css'

export interface PageHeaderProps {
  readonly title: string
  readonly eyebrow?: string | undefined
  readonly sub?: ReactNode
  readonly actions?: ReactNode
}

export function PageHeader({ title, eyebrow, sub, actions }: PageHeaderProps) {
  return (
    <div className={styles.pageHead}>
      <div className={styles.pageTitleBlock}>
        {eyebrow ? <span className="cap">{eyebrow}</span> : null}
        <h1 className={styles.pageTitle}>{title}</h1>
        {sub ? <span className={styles.pageSub}>{sub}</span> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </div>
  )
}

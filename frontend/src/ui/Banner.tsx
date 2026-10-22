import type { ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Banner.module.css'
import { Icon } from './icons/Icon'

export type BannerTone = 'info' | 'critical' | 'warn' | 'neutral'

export interface BannerProps {
  readonly tone?: BannerTone
  readonly title?: string
  readonly children?: ReactNode
  readonly action?: ReactNode
}

/** Critical banners use role="alert"; others are plain regions. */
export function Banner({ tone = 'info', title, children, action }: BannerProps) {
  return (
    <div className={cx(styles.banner, styles[tone])} role={tone === 'critical' ? 'alert' : undefined}>
      <span className={styles.icon}>
        <Icon name="info" />
      </span>
      <span className={styles.body}>
        {title ? <strong className={styles.title}>{title} </strong> : null}
        {children}
      </span>
      {action ? <span className={styles.action}>{action}</span> : null}
    </div>
  )
}

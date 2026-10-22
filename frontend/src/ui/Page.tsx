import type { ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Page.module.css'

export interface PageProps {
  readonly area: 'portal' | 'staff'
  readonly width?: 920 | 1160 | 1200
  readonly gap?: number
  readonly children: ReactNode
}

/** Page content container with the design's padding and max width per area. */
export function Page({ area, width = 1160, gap, children }: PageProps) {
  if (area === 'portal') {
    return (
      <div className={cx(styles.page, styles.portal)} style={gap ? { gap } : undefined}>
        {children}
      </div>
    )
  }
  return (
    <div className={cx(styles.page, styles.staff)}>
      <div className={cx(styles.inner, styles[`w${width}`])} style={gap ? { gap } : undefined}>
        {children}
      </div>
    </div>
  )
}

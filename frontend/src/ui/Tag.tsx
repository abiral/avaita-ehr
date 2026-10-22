import type { ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Tag.module.css'

export type TagTone = 'neutral' | 'info' | 'alert' | 'critical' | 'warn' | 'outline'

export interface TagProps {
  readonly tone?: TagTone
  readonly size?: 'sm' | 'md'
  readonly children: ReactNode
}

/** Status tag. The text always carries the meaning; color only reinforces it. */
export function Tag({ tone = 'neutral', size = 'md', children }: TagProps) {
  return (
    <span className={cx(styles.tag, tone !== 'neutral' && styles[tone], size === 'sm' && styles.sm)}>{children}</span>
  )
}

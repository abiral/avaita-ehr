import type { ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Card.module.css'

export interface CardProps {
  readonly children: ReactNode
  readonly as?: 'section' | 'div' | 'aside' | 'article'
  readonly padded?: boolean
  readonly labelledBy?: string
  readonly className?: string | undefined
}

export function Card({ children, as: Tag = 'div', padded = false, labelledBy, className }: CardProps) {
  return (
    <Tag className={cx(styles.card, padded ? styles.padded : styles.clip, className)} aria-labelledby={labelledBy}>
      {children}
    </Tag>
  )
}

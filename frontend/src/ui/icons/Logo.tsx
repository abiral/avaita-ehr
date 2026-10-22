import { cx } from '@/shared/cx'
import styles from './Logo.module.css'

export interface LogoProps {
  readonly size?: 'md' | 'lg'
  readonly label?: string
}

export function Logo({ size = 'md', label = 'Folio' }: LogoProps) {
  const px = size === 'lg' ? 28 : 22
  return (
    <span className={cx(styles.logo, styles[size])}>
      <svg width={px} height={px} viewBox="0 0 22 22" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="20" height="20" rx="5" fill="#1F56B4" />
        <path d="M7 7h8M7 11h6M7 15h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className={styles.word}>{label}</span>
    </span>
  )
}

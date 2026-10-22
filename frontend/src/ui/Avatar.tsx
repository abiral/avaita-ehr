import { cx } from '@/shared/cx'
import styles from './Misc.module.css'

export interface AvatarProps {
  readonly initials: string
  readonly size?: 'md' | 'lg'
}

/** Initials avatar. Decorative: the name is always shown next to it. */
export function Avatar({ initials, size = 'md' }: AvatarProps) {
  return (
    <span className={cx(styles.avatar, size === 'lg' && styles.avatarLg)} aria-hidden="true">
      {initials}
    </span>
  )
}

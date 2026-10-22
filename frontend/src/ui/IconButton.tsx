import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/shared/cx'
import styles from './Button.module.css'
import { Icon } from './icons/Icon'
import type { IconName } from './icons/paths'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  readonly icon: IconName
  /** Required: the accessible name of the button. */
  readonly label: string
  readonly outlined?: boolean
}

export function IconButton({ icon, label, outlined = false, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(styles.btn, styles.icon, outlined && styles.iconOutlined)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}

import { NavLink } from 'react-router'
import { cx } from '@/shared/cx'
import styles from './Tabs.module.css'

export interface LinkTabItem {
  readonly to: string
  readonly label: string
  readonly end?: boolean
}

/** Navigation styled as tabs (chart tabs). Uses aria-current, not the tab role. */
export function LinkTabs({
  label,
  items,
  compact = true,
}: {
  readonly label: string
  readonly items: readonly LinkTabItem[]
  readonly compact?: boolean
}) {
  return (
    <nav className={cx(styles.tabs, compact && styles.compact)} aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end ?? false} className={styles.tab ?? ''}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

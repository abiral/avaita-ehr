import { NavLink } from 'react-router'
import styles from './Shell.module.css'

export interface SideNavItem {
  readonly to: string
  readonly label: string
  readonly end?: boolean
  readonly count?: number | undefined
}

export function SideNav({
  label,
  caption,
  items,
}: {
  readonly label: string
  readonly caption?: string
  readonly items: readonly SideNavItem[]
}) {
  return (
    <nav className={styles.nav} aria-label={label}>
      {caption ? <span className={`cap ${styles.navCap ?? ''}`}>{caption}</span> : null}
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end ?? false}>
          {item.label}
          {item.count ? (
            <>
              {' '}
              <span className={styles.count}>{item.count}</span>
            </>
          ) : null}
        </NavLink>
      ))}
    </nav>
  )
}

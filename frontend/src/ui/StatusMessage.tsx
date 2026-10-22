import type { ReactNode } from 'react'
import styles from './Toast.module.css'

/** Inline confirmation bar at the top of a page (role="status"). Errors use Banner instead. */
export function StatusMessage({ children }: { readonly children: ReactNode }) {
  return (
    <div role="status" className={styles.inline}>
      {children}
    </div>
  )
}

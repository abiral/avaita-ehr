import styles from './Card.module.css'
import { Skeleton } from './Skeleton'

/** Loading placeholder sized like list rows, announced once to screen readers. */
export function SkeletonRows({ rows = 3, label }: { readonly rows?: number; readonly label: string }) {
  return (
    <div role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.stack} style={{ flex: 1, gap: 6 }}>
            <Skeleton width="40%" />
            <Skeleton width="65%" height={12} />
          </span>
          <Skeleton width={72} height={22} />
        </div>
      ))}
    </div>
  )
}

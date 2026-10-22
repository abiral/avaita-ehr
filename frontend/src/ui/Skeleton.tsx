import styles from './Misc.module.css'

export interface SkeletonProps {
  readonly width?: string | number
  readonly height?: number
}

export function Skeleton({ width = '100%', height = 14 }: SkeletonProps) {
  return <span className={styles.skeleton} style={{ width, height }} aria-hidden="true" />
}

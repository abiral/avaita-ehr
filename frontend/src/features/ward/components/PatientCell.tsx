import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { PatientListItem } from '@/domain/clinical'
import styles from '../Ward.module.css'
import { demographics } from '../model/patientRows'

/** Name (a link into the chart) over age, sex and MRN. */
export function PatientCell({
  p,
  now,
  timeZone,
}: {
  readonly p: PatientListItem
  readonly now: Date
  readonly timeZone: string
}) {
  return (
    <span className={styles.patient}>
      <Link to={paths.staff.chart(p.id)} className={styles.name}>
        {p.displayName}
      </Link>
      <span className={styles.demo}>{demographics(p, now, timeZone)}</span>
    </span>
  )
}

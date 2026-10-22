import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { formatTime, t } from '@/i18n'
import { cx } from '@/shared/cx'
import styles from '../Schedule.module.css'
import type { GridItem } from '../model/grid'

/** Entries up to half an hour put the description on the name line. */
const COMPACT_BELOW = 4

const TAG_KEY = { seen: 'seen', arrived: 'arrived', video: 'video', noShow: 'noShow' } as const

function Body({ item }: { readonly item: GridItem }) {
  return (
    <>
      <span className={styles.entryTop}>
        <span className={styles.entryName}>{item.name}</span>
        {item.tag ? <span className={styles.entryTag}>{t(`staff.schedule.${TAG_KEY[item.tag]}`)}</span> : null}
      </span>
      <span className={styles.entryWhat}>{item.what}</span>
    </>
  )
}

/** One appointment or blocked period, placed on the ten-minute grid; appointments open the chart. */
export function GridEntry({ item, timeZone }: { readonly item: GridItem; readonly timeZone: string }) {
  const label = t('staff.schedule.itemLabel', {
    name: item.name,
    time: formatTime(item.start, timeZone),
    what: item.what,
  })
  const className = cx(styles.entry, styles[item.look], item.span < COMPACT_BELOW && styles.compact)
  return (
    <li className={styles.item} style={{ gridRow: `${String(item.row)} / span ${String(item.span)}` }}>
      {item.patientId && item.look !== 'cancelled' ? (
        <Link to={paths.staff.chart(item.patientId)} className={className} aria-label={label}>
          <Body item={item} />
        </Link>
      ) : (
        <div className={className} aria-label={label} role="group">
          <Body item={item} />
        </div>
      )}
    </li>
  )
}

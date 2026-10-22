import type { TimeOff } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Card, CardHeader, EmptyState, SkeletonRows, Tag } from '@/ui'
import { whenText } from '../model/labels'
import styles from '../TimeOff.module.css'

const KIND = {
  full: 'admin.leave.kindLeave',
  part: 'admin.leave.kindPart',
  recurring: 'admin.leave.kindRecurring',
} as const

export function UpcomingList({
  items,
  loading,
  timeZone,
}: {
  readonly items: readonly TimeOff[]
  readonly loading: boolean
  readonly timeZone: string
}) {
  return (
    <Card as="section" labelledBy="up">
      <CardHeader id="up" title={t('admin.leave.upcoming')} />
      {loading ? <SkeletonRows label={t('admin.leave.loading')} rows={3} /> : null}
      {!loading && items.length === 0 ? <EmptyState title={t('admin.leave.noneUpcoming')} /> : null}
      {items.map((o) => (
        <div key={o.id} className={styles.item}>
          <span className={styles.itemText}>
            <span className={styles.itemName}>{o.practitionerName}</span>
            <span className={styles.itemWhen}>
              {whenText(o, timeZone)} · {t(`admin.leave.reasons.${o.reason}`)}
            </span>
            <span className={styles.itemImpact}>{o.impactNote}</span>
          </span>
          <Tag tone={o.kind === 'full' ? 'warn' : 'neutral'}>{t(KIND[o.kind])}</Tag>
        </div>
      ))}
    </Card>
  )
}

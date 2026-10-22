import { Link } from 'react-router'
import type { InboxItem } from '@/domain/labs'
import { formatTime, t } from '@/i18n'
import { Card, SkeletonRows, Tag } from '@/ui'
import styles from '../Results.module.css'
import { inboxTag } from '../model/trend'

export interface InboxNavProps {
  readonly items: readonly InboxItem[] | undefined
  readonly openId: string | null
  readonly linkTo: (id: string) => string
  readonly timeZone: string
}

/** Result list: unreviewed and most severe first; each tag says its status in words. */
export function InboxNav({ items, openId, linkTo, timeZone }: InboxNavProps) {
  const left = (items ?? []).filter((i) => i.review === 'unreviewed').length
  return (
    <Card className={styles.nav}>
      <nav aria-label={t('clinical.results.inbox')}>
        <div className={styles.navHead}>
          <span className="cap">{t('clinical.results.inboxCap')}</span>
          <span className={styles.count}>{t('clinical.results.left', { count: left })}</span>
        </div>
        {items ? null : <SkeletonRows label={t('clinical.results.loading')} rows={5} />}
        {items?.length === 0 ? <p className={styles.empty}>{t('clinical.results.empty')}</p> : null}
        <ul className={styles.list}>
          {(items ?? []).map((item) => {
            const tag = inboxTag(item)
            return (
              <li key={item.id}>
                <Link
                  to={linkTo(item.id)}
                  className={styles.inb}
                  aria-current={item.id === openId ? 'page' : undefined}
                >
                  <span className={styles.inbRow}>
                    <span className={styles.who}>{item.patientName}</span>
                    <span className={styles.time}>{formatTime(item.reportedAt, timeZone)}</span>
                  </span>
                  <span className={styles.inbRow}>
                    <span className={styles.test}>{item.panel}</span>
                    <Tag tone={tag.tone}>{tag.text}</Tag>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </Card>
  )
}

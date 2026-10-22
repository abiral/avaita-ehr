import type { ReactNode } from 'react'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Icon, Tag } from '@/ui'
import styles from '../Packages.module.css'
import type { PackageCardView } from '../model/cardView'

export interface PackageCardProps {
  readonly view: PackageCardView
  readonly action: ReactNode
  /** P6 lists show the first three items; the A3 preview shows everything and the description. */
  readonly maxItems?: number
  readonly showDescription?: boolean
  readonly headingLevel?: 2 | 3
}

/** One package as patients see it. Rendered by P6 and by the A3 live preview. */
export function PackageCard({ view, action, maxItems, showDescription = false, headingLevel = 2 }: PackageCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const items = maxItems === undefined ? view.items : view.items.slice(0, maxItems)
  return (
    <Card as="article" className={styles.card}>
      <div className={styles.tags}>
        <Tag>{view.category}</Tag>
        <Tag tone="info">{view.formatLabel}</Tag>
      </div>
      <div className={styles.nameBlock}>
        <Heading className={styles.cardName}>{view.name}</Heading>
        <span className={styles.secondary}>{view.doctor}</span>
      </div>
      {showDescription ? <span className={styles.secondary}>{view.description}</span> : null}
      <IncludedList items={items} />
      <div className={styles.foot}>
        <span className={styles.priceBlock}>
          <span className={styles.price}>{view.price}</span>
          <span className={styles.small}>{t('portal.packages.valid', { validity: view.validity })}</span>
        </span>
        {action}
      </div>
    </Card>
  )
}

export function IncludedList({
  items,
  large = false,
}: {
  readonly items: readonly string[]
  readonly large?: boolean
}) {
  return (
    <ul className={cx(styles.includes, large && styles.includesLarge)}>
      {items.map((label, i) => (
        <li key={`${String(i)}-${label}`} className={styles.inc}>
          <span className={styles.check}>
            <Icon name="check" size={14} strokeWidth={2.2} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}

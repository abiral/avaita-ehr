import type { PackageId } from '@/core/branded'
import type { ConsultationPackage } from '@/domain/packages'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Tag } from '@/ui'
import { validityLabel } from '@/features/patient-packages'
import styles from '../AdminPackages.module.css'

export interface PackageTableProps {
  readonly packages: readonly ConsultationPackage[]
  readonly selected: PackageId | null
  readonly onSelect: (id: PackageId) => void
}

export const StatusTag = ({ published }: { readonly published: boolean }) =>
  published ? (
    <Tag tone="info">{t('admin.packages.published')}</Tag>
  ) : (
    <Tag tone="outline">{t('admin.packages.draft')}</Tag>
  )

function Row({
  p,
  on,
  onSelect,
}: {
  readonly p: ConsultationPackage
  readonly on: boolean
  readonly onSelect: () => void
}) {
  const status = p.published ? t('admin.packages.published') : t('admin.packages.draft')
  return (
    <li>
      <button
        type="button"
        className={cx(styles.row, styles.cols)}
        aria-pressed={on}
        aria-label={`${p.name}, ${p.practitionerName}, ${status}`}
        onClick={onSelect}
      >
        <span className={styles.nameCell}>
          <span className={styles.rowName}>{p.name}</span>
          <span className={styles.meta}>
            {t('admin.packages.rowMeta', { category: p.category, validity: validityLabel(p.validityDays) })}
          </span>
        </span>
        <span className={styles.cell}>{p.practitionerName}</span>
        <span className={styles.cell}>{t(`portal.packages.formats.${p.format}.name`)}</span>
        <span className={cx(styles.cell, styles.num)}>{p.bookedCount}</span>
        <span>
          <StatusTag published={p.published} />
        </span>
      </button>
    </li>
  )
}

/** A3 package list: rows select the package shown in the editor. */
export function PackageTable({ packages, selected, onSelect }: PackageTableProps) {
  return (
    <Card as="section" className={styles.tableCard} labelledBy="pkg-list">
      <h2 id="pkg-list" className="visually-hidden">
        {t('admin.packages.list')}
      </h2>
      <div className={styles.scroll}>
        <div className={styles.table}>
          <div className={cx('cap', styles.cols, styles.thead)} aria-hidden="true">
            <span>{t('admin.packages.columns.name')}</span>
            <span>{t('admin.packages.columns.doctor')}</span>
            <span>{t('admin.packages.columns.format')}</span>
            <span className={styles.num}>{t('admin.packages.columns.booked')}</span>
            <span>{t('admin.packages.columns.status')}</span>
          </div>
          <ul className={styles.rows}>
            {packages.map((p) => (
              <Row key={p.id} p={p} on={p.id === selected} onSelect={() => onSelect(p.id)} />
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

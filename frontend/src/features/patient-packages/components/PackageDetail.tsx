import { useTenant } from '@/app/TenantProvider'
import type { ConsultationPackage } from '@/domain/packages'
import { t } from '@/i18n'
import { initials } from '@/domain/identity'
import { Avatar, Button, Card, Tag } from '@/ui'
import styles from '../Packages.module.css'
import { formatLabel, validityLabel } from '../model/cardView'
import { IncludedList } from './PackageCard'

/** P6 detail: what the package is, who runs it, what is included and the terms. */
export function PackageDetail({ pkg, onBack }: { readonly pkg: ConsultationPackage; readonly onBack: () => void }) {
  const { facility } = useTenant()
  return (
    <Card as="article" className={styles.detail} labelledBy="pkg-name">
      <span className={styles.back}>
        <Button size="sm" onClick={onBack}>
          {t('portal.packages.allPackages')}
        </Button>
      </span>
      <div className={styles.detailHead}>
        <span className={styles.tagRow}>
          <Tag>{pkg.category}</Tag>
          <Tag tone="info">{formatLabel(pkg.format)}</Tag>
        </span>
        <h2 id="pkg-name" className={styles.detailName}>
          {pkg.name}
        </h2>
        <span className={styles.muted}>{pkg.description}</span>
      </div>
      <div className={styles.doctor}>
        <Avatar initials={initials(pkg.practitionerName)} size="lg" />
        <span className={styles.doctorText}>
          <span className={styles.doctorName}>{pkg.practitionerName}</span>
          <span className={styles.doctorMeta}>
            {t('portal.packages.doctorAt', { category: pkg.category, facility: facility?.shortName ?? '' })}
          </span>
        </span>
      </div>
      <div className={styles.section}>
        <span className="cap">{t('portal.packages.included')}</span>
        <IncludedList items={pkg.items.map((i) => i.label)} large />
      </div>
      <dl className={styles.facts}>
        <dt>{t('portal.packages.validFor')}</dt>
        <dd>{t('portal.packages.validFrom', { validity: validityLabel(pkg.validityDays) })}</dd>
        <dt>{t('portal.packages.cancellation')}</dt>
        <dd>{t('portal.packages.cancellationText')}</dd>
      </dl>
    </Card>
  )
}

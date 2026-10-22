import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { ConsultationPackage } from '@/domain/packages'
import { t } from '@/i18n'
import { Banner, Button, Card, Chip, SearchInput, SkeletonRows } from '@/ui'
import styles from '../Packages.module.css'
import { toCardView } from '../model/cardView'
import type { usePackageList } from '../model/usePackageList'
import { PackageCard } from './PackageCard'

const LIST_ITEMS = 3

function Results({
  list,
  onOpen,
}: {
  readonly list: ReturnType<typeof usePackageList>
  readonly onOpen: (p: ConsultationPackage) => void
}) {
  if (list.query.isError)
    return (
      <Banner
        tone="critical"
        action={
          <Button size="sm" onClick={() => void list.query.refetch()}>
            {t('portal.packages.retry')}
          </Button>
        }
      >
        {t('portal.packages.loadFailed')}
      </Banner>
    )
  if (list.query.isPending)
    return (
      <Card>
        <SkeletonRows label={t('portal.packages.loading')} rows={4} />
      </Card>
    )
  if (list.visible.length === 0)
    return (
      <Card className={styles.empty}>
        {t('portal.packages.noMatch')} <Link to={paths.portal.book}>{t('portal.packages.singleInstead')}</Link>.
      </Card>
    )
  return (
    <ul className={styles.grid} aria-label={t('portal.packages.list')}>
      {list.visible.map((p) => (
        <li key={p.id}>
          <PackageCard
            view={toCardView(p)}
            maxItems={LIST_ITEMS}
            action={
              <Button
                variant="primary"
                size="sm"
                aria-label={t('portal.packages.viewNamed', { name: p.name })}
                onClick={() => onOpen(p)}
              >
                {t('portal.packages.view')}
              </Button>
            }
          />
        </li>
      ))}
    </ul>
  )
}

/** P6 browse: intro, search, category chips and the package grid. */
export function BrowseView({
  list,
  onOpen,
}: {
  readonly list: ReturnType<typeof usePackageList>
  readonly onOpen: (p: ConsultationPackage) => void
}) {
  return (
    <div className={styles.stack}>
      <p className={styles.intro}>{t('portal.packages.intro')}</p>
      <SearchInput
        size="lg"
        label={t('portal.packages.search')}
        placeholder={t('portal.packages.searchPlaceholder')}
        value={list.q}
        onChange={(e) => list.setQ(e.target.value)}
      />
      <div className={styles.chips} role="group" aria-label={t('portal.packages.categories')}>
        <Chip
          label={t('portal.packages.all')}
          selected={list.category === null}
          onToggle={() => list.setCategory(null)}
        />
        {list.categories.map((c) => (
          <Chip key={c} label={c} selected={list.category === c} onToggle={() => list.setCategory(c)} />
        ))}
      </div>
      <Results list={list} onOpen={onOpen} />
    </div>
  )
}

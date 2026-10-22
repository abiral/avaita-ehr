import { paths } from '@/app/routes'
import type { Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Button, Card, Chip, EmptyState, LinkTabs, SearchInput, SkeletonRows } from '@/ui'
import styles from '../Booking.module.css'
import type { CategoryCount } from '../model/useDoctorSearch'
import { DoctorRow } from './DoctorRow'

export interface SearchStepProps {
  readonly q: string
  readonly category: string | null
  readonly counts: readonly CategoryCount[]
  readonly doctors: readonly Practitioner[]
  readonly loading: boolean
  readonly today: string
  readonly timeZone: string
  readonly dateOf: (d: Date) => string
  readonly actions: {
    readonly setQ: (q: string) => void
    readonly setCategory: (c: string | null) => void
    readonly reset: () => void
    readonly select: (d: Practitioner) => void
  }
}

const resultText = (count: number, category: string | null): string => {
  if (category)
    return count === 1
      ? t('portal.booking.resultsOneIn', { category })
      : t('portal.booking.resultsIn', { count, category })
  return count === 1 ? t('portal.booking.resultsOne') : t('portal.booking.results', { count })
}

type ResultsProps = Pick<
  SearchStepProps,
  'doctors' | 'category' | 'loading' | 'today' | 'timeZone' | 'dateOf' | 'actions'
>

function Results({ doctors, category, loading, today, timeZone, dateOf, actions }: ResultsProps) {
  return (
    <Card>
      <div className={styles.resultsHead} aria-live="polite">
        <span className={styles.resultsCount}>{resultText(doctors.length, category)}</span>
        <span className={styles.small}>{t('portal.booking.sorted')}</span>
      </div>
      {loading ? <SkeletonRows label={t('portal.booking.loading')} rows={4} /> : null}
      {doctors.map((d) => (
        <DoctorRow
          key={d.id}
          doctor={d}
          today={today}
          timeZone={timeZone}
          dateOf={dateOf}
          onSelect={() => actions.select(d)}
        />
      ))}
      {!loading && doctors.length === 0 ? (
        <EmptyState
          title={t('portal.booking.noMatch')}
          body={t('portal.booking.noMatchBody')}
          action={
            <Button size="sm" onClick={actions.reset}>
              {t('portal.booking.showAll')}
            </Button>
          }
        />
      ) : null}
    </Card>
  )
}

/** P5 step 1: search by name or concern, category chips with counts, results sorted by next available. */
export function SearchStep({
  q,
  category,
  counts,
  doctors,
  loading,
  today,
  timeZone,
  dateOf,
  actions,
}: SearchStepProps) {
  const clear = q ? (
    <Button size="sm" onClick={() => actions.setQ('')}>
      {t('portal.booking.clear')}
    </Button>
  ) : null
  return (
    <div className={styles.stack}>
      <LinkTabs
        label={t('portal.booking.bookBy')}
        compact={false}
        items={[
          { to: paths.portal.book, label: t('portal.booking.doctorsTab'), end: true },
          { to: paths.portal.packages, label: t('portal.booking.packagesTab') },
        ]}
      />
      <SearchInput
        size="lg"
        label={t('portal.booking.search')}
        placeholder={t('portal.booking.searchPlaceholder')}
        value={q}
        onChange={(e) => actions.setQ(e.target.value)}
        suffix={clear}
      />
      <div className={styles.chips} role="group" aria-label={t('portal.booking.categories')}>
        {counts.map((c) => (
          <Chip
            key={c.category ?? 'all'}
            label={c.category ?? t('portal.booking.all')}
            count={c.count}
            selected={c.category === category}
            onToggle={() => actions.setCategory(c.category)}
          />
        ))}
      </div>
      <Results
        doctors={doctors}
        category={category}
        loading={loading}
        today={today}
        timeZone={timeZone}
        dateOf={dateOf}
        actions={actions}
      />
    </div>
  )
}

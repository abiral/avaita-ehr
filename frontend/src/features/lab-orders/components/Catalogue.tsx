import { LAB_CATEGORIES, type LabTest, type OrderSet } from '@/domain/labs'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Button, Card, SearchInput, SkeletonRows } from '@/ui'
import styles from '../Orders.module.css'
import { toggleTest, visibleTests } from '../model/basket'
import type { useLabOrder } from '../model/useLabOrder'

type Order = ReturnType<typeof useLabOrder>

function OrderSets({
  sets,
  tests,
  onAdd,
}: {
  readonly sets: readonly OrderSet[]
  readonly tests: readonly LabTest[]
  readonly onAdd: (s: OrderSet) => void
}) {
  if (sets.length === 0) return null
  const nameOf = (code: string) => tests.find((x) => x.code === code)?.name ?? code
  return (
    <>
      <div className={cx('cap', styles.cap)}>{t('clinical.orders.orderSets')}</div>
      <ul className={styles.list}>
        {sets.map((s) => (
          <li key={s.id} className={styles.li}>
            <span className={styles.stack}>
              <span className={styles.strong}>{s.name}</span>
              <span className={styles.muted}>{s.testCodes.map(nameOf).join(', ')}</span>
            </span>
            <Button size="sm" aria-label={t('clinical.orders.addSetNamed', { name: s.name })} onClick={() => onAdd(s)}>
              {t('clinical.orders.addSet')}
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}

function Tests({ o, tests }: { readonly o: Order; readonly tests: readonly LabTest[] }) {
  const shown = visibleTests(tests, o.filter.category, o.filter.q)
  return (
    <>
      <div className={cx('cap', styles.cap)}>{t('clinical.orders.tests')}</div>
      {shown.length === 0 ? <p className={styles.empty}>{t('clinical.orders.noTests')}</p> : null}
      <ul className={styles.list}>
        {shown.map((test) => {
          const added = o.basket.some((b) => b.testCode === test.code)
          return (
            <li key={test.code} className={styles.li}>
              <span className={styles.stack}>
                <span className={styles.strong}>{test.name}</span>
                <span className={styles.muted}>
                  {t('clinical.orders.meta', { specimen: test.specimen, turnaround: test.turnaround })}
                </span>
              </span>
              <Button
                size="sm"
                variant={added ? 'primary' : 'secondary'}
                aria-pressed={added}
                aria-label={t('clinical.orders.addTest', { test: test.name })}
                onClick={() => o.changeBasket(toggleTest(o.basket, test.code))}
              >
                {added ? t('clinical.orders.added') : t('clinical.orders.add')}
              </Button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** C7 left: search, categories, order sets and tests with Add toggles. */
export function Catalogue({ o, onAddSet }: { readonly o: Order; readonly onAddSet: (s: OrderSet) => void }) {
  const data = o.catalogue.data
  return (
    <Card as="section" className={styles.catalogue} labelledBy="catalogue">
      <h2 id="catalogue" className="visually-hidden">
        {t('clinical.orders.catalogue')}
      </h2>
      <div className={styles.tools}>
        <SearchInput
          size="lg"
          label={t('clinical.orders.search')}
          value={o.filter.q}
          onChange={(e) => o.filter.setQ(e.target.value)}
        />
        <div className={styles.cats} role="group" aria-label={t('clinical.orders.categories')}>
          {LAB_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.cat}
              aria-pressed={o.filter.category === c}
              onClick={() => o.filter.setCategory(c)}
            >
              {t(`clinical.orders.category.${c}`)}
            </button>
          ))}
        </div>
      </div>
      {data ? (
        <>
          <OrderSets sets={data.orderSets} tests={data.tests} onAdd={onAddSet} />
          <Tests o={o} tests={data.tests} />
        </>
      ) : (
        <SkeletonRows label={t('clinical.orders.loading')} rows={6} />
      )}
    </Card>
  )
}

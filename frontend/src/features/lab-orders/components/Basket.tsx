import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { PRIORITIES, type LabTest, type Priority } from '@/domain/labs'
import { formatShortDate, formatTime, t } from '@/i18n'
import { Banner, Button, Card, Select, StatusMessage, TextField } from '@/ui'
import styles from '../Orders.module.css'
import { COLLECT_OPTIONS, updateItem, type BasketItem, type CollectOption } from '../model/basket'
import type { useLabOrder } from '../model/useLabOrder'

type Order = ReturnType<typeof useLabOrder>

const isPriority = (v: string): v is Priority => PRIORITIES.some((p) => p === v)
const isCollect = (v: string): v is CollectOption => COLLECT_OPTIONS.some((c) => c === v)

interface ItemProps {
  readonly o: Order
  readonly item: BasketItem
  readonly test: LabTest | undefined
  readonly now: Date
  readonly timeZone: string
}

function Item({ o, item, test, now, timeZone }: ItemProps) {
  const name = test?.name ?? item.testCode
  const dup = o.duplicates.get(item.testCode)
  const set = (patch: Partial<BasketItem>) => o.changeBasket(updateItem(o.basket, item.testCode, patch))
  return (
    <li className={styles.item}>
      <span className={styles.itemHead}>
        <span className={styles.itemName}>{name}</span>
        <Button
          size="sm"
          aria-label={t('clinical.orders.removeTest', { test: name })}
          onClick={() => o.changeBasket(o.basket.filter((b) => b.testCode !== item.testCode))}
        >
          {t('clinical.orders.remove')}
        </Button>
      </span>
      <div className={styles.pair}>
        <Select
          size="sm"
          aria-label={t('clinical.orders.priorityFor', { test: name })}
          value={item.priority}
          onChange={(e) => {
            if (isPriority(e.target.value)) set({ priority: e.target.value })
          }}
          options={PRIORITIES.map((p) => ({ value: p, label: t(`clinical.orders.priorities.${p}`) }))}
        />
        <Select
          size="sm"
          aria-label={t('clinical.orders.collectFor', { test: name })}
          value={item.collect}
          onChange={(e) => {
            if (isCollect(e.target.value)) set({ collect: e.target.value })
          }}
          options={COLLECT_OPTIONS.map((c) => ({
            value: c,
            label: t(`clinical.orders.collectOptions.${c}`, { time: formatTime(now, timeZone) }),
          }))}
        />
      </div>
      {dup ? (
        <span className={styles.warn}>
          {t('clinical.orders.duplicate', { when: `${formatShortDate(dup, timeZone)} ${formatTime(dup, timeZone)}` })}
        </span>
      ) : null}
    </li>
  )
}

function Sent({ patientId }: { readonly patientId: string }) {
  return (
    <div className={styles.sent}>
      <StatusMessage>
        <span className={styles.sentBody}>
          <strong>{t('clinical.orders.sentTitle')}</strong>
          <span>{t('clinical.orders.sentText')}</span>
          <Link to={paths.staff.chartResults(patientId)}>{t('clinical.orders.goToResults')}</Link>
        </span>
      </StatusMessage>
    </div>
  )
}

/** C7 right: the basket with priority, collection time, duplicate warnings, indication and Sign and send. */
export function Basket({ o, now, timeZone }: { readonly o: Order; readonly now: Date; readonly timeZone: string }) {
  const tests = o.catalogue.data?.tests ?? []
  return (
    <Card as="section" className={styles.basket} labelledBy="basket">
      <div className={styles.basketHead}>
        <h2 id="basket" className={styles.basketTitle}>
          {t('clinical.orders.basket')}
        </h2>
        <span className={styles.count}>{o.basket.length}</span>
      </div>
      {o.sent ? <Sent patientId={o.patientId} /> : null}
      {o.basket.length === 0 ? <p className={styles.empty}>{t('clinical.orders.basketEmpty')}</p> : null}
      <ul className={styles.list}>
        {o.basket.map((item) => (
          <Item
            key={item.testCode}
            o={o}
            item={item}
            test={tests.find((x) => x.code === item.testCode)}
            now={now}
            timeZone={timeZone}
          />
        ))}
      </ul>
      <div className={styles.section}>
        <TextField
          label={t('clinical.orders.indication')}
          value={o.indication}
          onValue={o.setIndication}
          error={o.indicationMissing ? t('clinical.orders.indicationRequired') : undefined}
        />
        <span className={styles.muted}>{t('clinical.orders.billing')}</span>
      </div>
      {o.error ? (
        <div className={styles.section}>
          <Banner tone="critical">{o.error}</Banner>
        </div>
      ) : null}
      <div className={styles.foot}>
        {o.keptForLater ? (
          <span className={styles.footNote} role="status">
            {t('clinical.orders.savedForLater')}
          </span>
        ) : null}
        <Button disabled={o.basket.length === 0} onClick={o.keepForLater}>
          {t('clinical.orders.saveLater')}
        </Button>
        <Button variant="primary" disabled={o.basket.length === 0 || o.sending} onClick={() => void o.submit()}>
          {o.sending ? t('clinical.orders.sending') : t('clinical.orders.send')}
        </Button>
      </div>
    </Card>
  )
}

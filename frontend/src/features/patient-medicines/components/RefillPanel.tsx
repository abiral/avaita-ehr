import { useTenant } from '@/app/TenantProvider'
import { PICKUPS, type Medication } from '@/domain/medications'
import { t } from '@/i18n'
import { Banner, Button, Field, Textarea } from '@/ui'
import styles from '../Medicines.module.css'
import type { RefillForm } from '../model/useMedicines'

const QUANTITIES = [30, 60, 90] as const

export interface RefillPanelProps {
  readonly m: Medication
  readonly form: RefillForm
  readonly busy: boolean
  readonly error: string | null
  readonly onForm: (form: RefillForm) => void
  readonly onCancel: () => void
  readonly onSend: () => void
}

type FormProps = Pick<RefillPanelProps, 'form' | 'onForm'>

function Quantity({ form, onForm }: FormProps) {
  return (
    <div className={styles.group} role="group" aria-labelledby="refill-qty">
      <span id="refill-qty" className={styles.groupLabel}>
        {t('portal.medicines.howMuch')}
      </span>
      <div className={styles.three}>
        {QUANTITIES.map((q) => (
          <button
            key={q}
            type="button"
            className={styles.opt}
            aria-pressed={form.quantityDays === q}
            onClick={() => onForm({ ...form, quantityDays: q })}
          >
            <span className={styles.optName}>{t('portal.medicines.quantity', { days: q })}</span>
            <span className={styles.optSub}>{t('portal.medicines.tablets', { count: q })}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Collect({ form, onForm }: FormProps) {
  const { facility } = useTenant()
  return (
    <div className={styles.group} role="group" aria-labelledby="refill-pickup">
      <span id="refill-pickup" className={styles.groupLabel}>
        {t('portal.medicines.collect')}
      </span>
      {PICKUPS.map((p) => (
        <button
          key={p}
          type="button"
          className={styles.opt}
          aria-pressed={form.pickup === p}
          onClick={() => onForm({ ...form, pickup: p })}
        >
          <span className={styles.optName}>{t(`portal.medicines.pickups.${p}.name`)}</span>
          <span className={styles.optSub}>
            {t(`portal.medicines.pickups.${p}.desc`, { facility: facility?.shortName ?? '' })}
          </span>
        </button>
      ))}
    </div>
  )
}

/** P9 aside: quantity, where to collect, a note, then Send request. */
export function RefillPanel({ m, form, busy, error, onForm, onCancel, onSend }: RefillPanelProps) {
  return (
    <>
      <div className={styles.panelHead}>
        <h2 id="refill-panel" className={styles.panelTitle}>
          {t('portal.medicines.panelTitle')}
        </h2>
        <span className={styles.muted}>{m.name}</span>
      </div>
      <Quantity form={form} onForm={onForm} />
      <Collect form={form} onForm={onForm} />
      <Field label={t('portal.medicines.note')}>
        {(c) => (
          <Textarea {...c} rows={2} value={form.note} onChange={(e) => onForm({ ...form, note: e.target.value })} />
        )}
      </Field>
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <div className={styles.buttons}>
        <Button onClick={onCancel}>{t('portal.medicines.cancel')}</Button>
        <Button variant="primary" disabled={busy} onClick={onSend}>
          {busy ? t('portal.medicines.sending') : t('portal.medicines.send')}
        </Button>
      </div>
      <p className={styles.foot}>{t('portal.medicines.reviewTime')}</p>
    </>
  )
}

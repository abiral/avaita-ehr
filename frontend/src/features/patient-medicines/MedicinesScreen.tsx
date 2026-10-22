import { useTenant } from '@/app/TenantProvider'
import type { Medication } from '@/domain/medications'
import { formatShortDate, t } from '@/i18n'
import { Banner, Button, Card, Page, SkeletonRows } from '@/ui'
import { MedicineCard } from './components/MedicineCard'
import { RefillPanel } from './components/RefillPanel'
import { useMedicines } from './model/useMedicines'
import styles from './Medicines.module.css'

type Screen = ReturnType<typeof useMedicines>

function Intro({ allergies }: { readonly allergies: readonly string[] }) {
  const { facility } = useTenant()
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>{t('portal.medicines.title')}</h1>
      <p className={styles.intro}>
        {t('portal.medicines.intro', { facility: facility?.shortName ?? '' })}{' '}
        {allergies.length > 0 ? (
          <>
            {t('portal.medicines.allergies')} <span className={styles.allergy}>{allergies.join(', ')}</span>
          </>
        ) : (
          t('portal.medicines.noAllergies')
        )}
      </p>
    </div>
  )
}

function Past({ meds, timeZone }: { readonly meds: readonly Medication[]; readonly timeZone: string }) {
  if (meds.length === 0) return null
  return (
    <>
      <span className="cap">{t('portal.medicines.past')}</span>
      <Card className={styles.past}>
        {meds.map((m) => (
          <div key={m.id} className={styles.pastRow}>
            <span className={styles.pastName}>{m.name}</span>
            <span className={styles.small}>
              {m.endedAt ? t('portal.medicines.ended', { date: formatShortDate(m.endedAt, timeZone) }) : ''}
            </span>
          </div>
        ))}
      </Card>
    </>
  )
}

function Aside({ s }: { readonly s: Screen }) {
  const { panel } = s
  return (
    <Card as="aside" className={styles.aside} labelledBy={panel ? 'refill-panel' : 'refill-idle'}>
      {panel ? (
        <RefillPanel
          m={panel}
          form={s.form}
          busy={s.send.isPending}
          error={s.error}
          onForm={s.setForm}
          onCancel={s.close}
          onSend={() => s.send.mutate(panel)}
        />
      ) : (
        <div className={styles.group}>
          <h2 id="refill-idle" className={styles.panelTitle}>
            {t('portal.medicines.refills')}
          </h2>
          <p className={styles.muted} role="status">
            {s.sent
              ? t('portal.medicines.sent', {
                  name: s.sent,
                  doctor: s.meds.find((m) => m.name === s.sent)?.prescriber ?? '',
                })
              : t('portal.medicines.choose')}
          </p>
          <p className={styles.foot}>{t('portal.medicines.pharmacy')}</p>
        </div>
      )}
    </Card>
  )
}

/** P9: current medicines with supply left, refill requests and their progress. */
export function MedicinesScreen() {
  const s = useMedicines()
  const { timeZone } = useTenant()
  const current = s.meds.filter((m) => m.status === 'active')
  if (s.query.isError)
    return (
      <Page area="portal">
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={() => void s.query.refetch()}>
              {t('portal.medicines.retry')}
            </Button>
          }
        >
          {t('portal.medicines.loadFailed')}
        </Banner>
      </Page>
    )
  return (
    <Page area="portal" gap={24}>
      <Intro allergies={s.query.data?.allergies ?? []} />
      <div className={styles.layout}>
        <section className={styles.list} aria-labelledby="current-meds">
          <span id="current-meds" className="cap">
            {current.length === 1
              ? t('portal.medicines.countOne')
              : t('portal.medicines.count', { count: current.length })}
          </span>
          {s.query.isPending ? <SkeletonRows label={t('portal.medicines.loading')} rows={3} /> : null}
          {s.query.isSuccess && current.length === 0 ? (
            <Card className={styles.med}>{t('portal.medicines.none')}</Card>
          ) : null}
          <ul className={styles.cards}>
            {current.map((m) => (
              <li key={m.id}>
                <MedicineCard
                  m={m}
                  selected={s.panel?.id === m.id}
                  timeZone={timeZone}
                  onRequest={() => s.open(m.id)}
                />
              </li>
            ))}
          </ul>
          <Past meds={s.meds.filter((m) => m.status === 'ended')} timeZone={timeZone} />
        </section>
        <Aside s={s} />
      </div>
    </Page>
  )
}

import { useId } from 'react'
import type { LocalDate, Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Banner, Button, Card, Checkbox, Field, Select, Textarea } from '@/ui'
import styles from '../Schedule.module.css'
import { FIRST_AVAILABLE, slotLabel, useBookFor, VISIT_TYPES, type VisitType } from '../model/useBookFor'
import { PatientPicker } from './PatientPicker'
import { SuggestedTimes } from './SuggestedTimes'

export interface BookForPanelProps {
  readonly doctors: readonly Practitioner[]
  readonly date: LocalDate
  readonly timeZone: string
}

const isVisitType = (v: string): v is VisitType => VISIT_TYPES.some((x) => x === v)

function Choices({
  s,
  doctors,
}: {
  readonly s: ReturnType<typeof useBookFor>
  readonly doctors: readonly Practitioner[]
}) {
  const { fields } = s
  return (
    <div className={styles.pair}>
      <Field label={t('staff.bookFor.visitType')}>
        {(c) => (
          <Select
            {...c}
            value={fields.visitType}
            onChange={(e) => {
              if (isVisitType(e.target.value)) fields.setVisitType(e.target.value)
              s.setPicked(0)
            }}
            options={VISIT_TYPES.map((v) => ({ value: v, label: t(`staff.bookFor.types.${v}`) }))}
          />
        )}
      </Field>
      <Field label={t('staff.bookFor.clinician')}>
        {(c) => (
          <Select
            {...c}
            value={fields.clinician}
            onChange={(e) => {
              fields.setClinician(e.target.value)
              s.setPicked(0)
            }}
            options={[
              ...doctors.map((d) => ({ value: d.id, label: d.displayName })),
              { value: FIRST_AVAILABLE, label: t('staff.bookFor.firstAvailable') },
            ]}
          />
        )}
      </Field>
    </div>
  )
}

/** C4 side panel: front desk and nurses book a suggested time for a patient. */
export function BookForPanel({ doctors, date, timeZone }: BookForPanelProps) {
  const s = useBookFor(doctors, date)
  const titleId = useId()
  const { fields } = s
  const ready = s.search.patient !== null && s.slot !== null
  return (
    <Card as="section" padded labelledBy={titleId} className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 id={titleId} className={styles.panelTitle}>
          {t('staff.bookFor.title')}
        </h2>
        <span className={styles.sub}>{t('staff.bookFor.sub')}</span>
      </div>
      <PatientPicker search={s.search} />
      <Choices s={s} doctors={doctors} />
      <SuggestedTimes
        suggestions={s.suggestions}
        picked={s.picked}
        loading={s.loading}
        showDoctor={fields.clinician === FIRST_AVAILABLE}
        timeZone={timeZone}
        onPick={s.setPicked}
      />
      <Field label={t('staff.bookFor.note')}>
        {(c) => (
          <Textarea
            {...c}
            rows={2}
            value={fields.note}
            onChange={(e) => {
              fields.setNote(e.target.value)
            }}
          />
        )}
      </Field>
      <Checkbox
        label={t('staff.bookFor.sms')}
        checked={fields.sms}
        onChange={(e) => {
          fields.setSms(e.target.checked)
        }}
      />
      {s.error ? <Banner tone="critical">{s.error}</Banner> : null}
      <Button variant="primary" disabled={!ready || s.busy} onClick={s.book}>
        {s.slot ? t('staff.bookFor.book', { slot: slotLabel(s.slot, timeZone) }) : t('staff.bookFor.bookDisabled')}
      </Button>
    </Card>
  )
}

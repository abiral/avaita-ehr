import type { PractitionerId } from '@/core/branded'
import { HANDLINGS, TIME_OFF_KINDS, TIME_OFF_REASONS, type Practitioner } from '@/domain/scheduling/types'
import type { TimeOffDraft } from '@/domain/scheduling/timeOffRange'
import { t } from '@/i18n'
import { Field, Radio, SegmentedControl, Select, Textarea, TextInput } from '@/ui'
import styles from '../TimeOff.module.css'

export interface DraftFieldsProps {
  readonly draft: TimeOffDraft
  readonly onChange: (patch: Partial<TimeOffDraft>) => void
}

const TIMES = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
].map((v) => ({ value: v, label: v }))

function TimeRange({ draft, onChange }: DraftFieldsProps) {
  return (
    <div className={styles.two}>
      <Field
        label={t('admin.leave.startTime')}
        compact
        hint={draft.kind === 'recurring' ? t('admin.leave.repeatsWeekly') : undefined}
      >
        {(c) => (
          <Select
            {...c}
            options={TIMES}
            value={draft.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        )}
      </Field>
      <Field label={t('admin.leave.endTime')} compact>
        {(c) => (
          <Select
            {...c}
            options={TIMES}
            value={draft.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
          />
        )}
      </Field>
    </div>
  )
}

export function KindAndDates({ draft, onChange }: DraftFieldsProps) {
  const part = draft.kind === 'part'
  return (
    <>
      <fieldset className={styles.group}>
        <legend className={styles.groupLabel}>{t('admin.leave.type')}</legend>
        <SegmentedControl
          label={t('admin.leave.type')}
          value={draft.kind}
          onChange={(kind) => onChange({ kind })}
          options={TIME_OFF_KINDS.map((k) => ({ value: k, label: t(`admin.leave.types.${k}`) }))}
        />
      </fieldset>
      <div className={styles.two}>
        <Field label={t('admin.leave.from')} compact>
          {(c) => (
            <TextInput
              {...c}
              type="date"
              value={draft.from}
              onChange={(e) => onChange({ from: e.target.value, to: part ? e.target.value : draft.to })}
            />
          )}
        </Field>
        <Field label={t('admin.leave.to')} compact>
          {(c) => (
            <TextInput
              {...c}
              type="date"
              value={part ? draft.from : draft.to}
              disabled={part}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          )}
        </Field>
      </div>
      {draft.kind === 'full' ? null : <TimeRange draft={draft} onChange={onChange} />}
    </>
  )
}

export function ReasonAndNote({ draft, onChange }: DraftFieldsProps) {
  return (
    <>
      <Field label={t('admin.leave.reason')} compact>
        {(c) => (
          <Select
            {...c}
            value={draft.reason}
            onChange={(e) => onChange({ reason: e.target.value as TimeOffDraft['reason'] })}
            options={TIME_OFF_REASONS.map((r) => ({ value: r, label: t(`admin.leave.reasons.${r}`) }))}
          />
        )}
      </Field>
      <Field label={t('admin.leave.note')} compact>
        {(c) => (
          <Textarea
            {...c}
            rows={2}
            value={draft.patientNote}
            onChange={(e) => onChange({ patientNote: e.target.value })}
          />
        )}
      </Field>
    </>
  )
}

export function Handling({
  draft,
  doctors,
  onChange,
}: DraftFieldsProps & { readonly doctors: readonly Practitioner[] }) {
  const covers = doctors.filter((d) => d.id !== draft.practitionerId)
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>{t('admin.leave.handlingLegend')}</legend>
      {HANDLINGS.map((h) => (
        <Radio
          key={h}
          name="handling"
          checked={draft.handling === h}
          onChange={() => onChange({ handling: h })}
          label={t(`admin.leave.handling.${h}`)}
          hint={t(`admin.leave.handling.${h}Hint`)}
        />
      ))}
      {draft.handling === 'reassign' ? (
        <Field label={t('admin.leave.cover')} compact>
          {(c) => (
            <Select
              {...c}
              value={draft.coverPractitionerId ?? ''}
              onChange={(e) => onChange({ coverPractitionerId: (e.target.value || null) as PractitionerId | null })}
              options={[
                { value: '', label: t('admin.leave.chooseCover') },
                ...covers.map((d) => ({ value: d.id, label: d.displayName })),
              ]}
            />
          )}
        </Field>
      ) : null}
    </fieldset>
  )
}

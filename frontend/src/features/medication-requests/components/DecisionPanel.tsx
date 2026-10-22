import { useState, type ReactElement } from 'react'
import { DECISIONS, PICKUPS, type DecisionKind, type RefillRequest } from '@/domain/medications'
import { t } from '@/i18n'
import { Banner, Button, Field, SegmentedControl, Select, TextField } from '@/ui'
import styles from '../Requests.module.css'
import {
  DECLINE_REASONS,
  formProblem,
  initialDecision,
  LAB_OPTIONS,
  QUANTITIES,
  REPEATS,
  type DecisionForm,
} from '../model/decisionForm'

interface FieldsProps {
  readonly form: DecisionForm
  readonly showProblem: boolean
  readonly onForm: (f: DecisionForm) => void
}

function pick<T extends string | number>(options: readonly T[], value: string): T | undefined {
  return options.find((o) => String(o) === value)
}

function ApproveFields({ form, onForm }: FieldsProps) {
  return (
    <div className={styles.grid}>
      <Field label={t('clinical.refills.quantity')}>
        {(c) => (
          <Select
            {...c}
            value={String(form.quantity)}
            onChange={(e) => onForm({ ...form, quantity: pick(QUANTITIES, e.target.value) ?? form.quantity })}
            options={QUANTITIES.map((q) => ({ value: String(q), label: t('clinical.refills.tablets', { count: q }) }))}
          />
        )}
      </Field>
      <Field label={t('clinical.refills.repeats')}>
        {(c) => (
          <Select
            {...c}
            value={String(form.repeats)}
            onChange={(e) => onForm({ ...form, repeats: pick(REPEATS, e.target.value) ?? form.repeats })}
            options={REPEATS.map((r) => ({
              value: String(r),
              label: r === 0 ? t('clinical.refills.repeatsNone') : String(r),
            }))}
          />
        )}
      </Field>
      <Field label={t('clinical.refills.sendTo')}>
        {(c) => (
          <Select
            {...c}
            value={form.sendTo}
            onChange={(e) => onForm({ ...form, sendTo: pick(PICKUPS, e.target.value) ?? form.sendTo })}
            options={PICKUPS.map((p) => ({ value: p, label: t(`portal.medicines.pickups.${p}.name`) }))}
          />
        )}
      </Field>
    </div>
  )
}

function ChangeFields({ form, showProblem, onForm }: FieldsProps) {
  return (
    <div className={styles.grid}>
      <TextField
        label={t('clinical.refills.newDose')}
        value={form.newDose}
        onValue={(newDose) => onForm({ ...form, newDose })}
        error={showProblem && formProblem(form) ? t('clinical.refills.newDoseRequired') : undefined}
      />
      <Field label={t('clinical.refills.labFollowUp')}>
        {(c) => (
          <Select
            {...c}
            value={form.labFollowUp}
            onChange={(e) => onForm({ ...form, labFollowUp: pick(LAB_OPTIONS, e.target.value) ?? form.labFollowUp })}
            options={LAB_OPTIONS.map((o) => ({ value: o, label: t(`clinical.refills.labOptions.${o}`) }))}
          />
        )}
      </Field>
    </div>
  )
}

function DeclineFields({ form, onForm }: FieldsProps) {
  return (
    <Field label={t('clinical.refills.declineReason')}>
      {(c) => (
        <Select
          {...c}
          value={form.declineReason}
          onChange={(e) =>
            onForm({ ...form, declineReason: pick(DECLINE_REASONS, e.target.value) ?? form.declineReason })
          }
          options={DECLINE_REASONS.map((o) => ({ value: o, label: t(`clinical.refills.declineReasons.${o}`) }))}
        />
      )}
    </Field>
  )
}

const FIELDS: Readonly<Record<DecisionKind, (p: FieldsProps) => ReactElement>> = {
  approve: ApproveFields,
  change: ChangeFields,
  decline: DeclineFields,
}

export interface DecisionPanelProps {
  readonly request: RefillRequest
  readonly busy: boolean
  readonly error: string | null
  readonly tried: boolean
  readonly onSubmit: (form: DecisionForm) => void
}

/** Approve, change dose or decline; the fields follow the choice. */
export function DecisionPanel({ request, busy, error, tried, onSubmit }: DecisionPanelProps) {
  const [form, setForm] = useState<DecisionForm>(() => initialDecision(request))
  const Fields = FIELDS[form.kind]
  return (
    <div className={styles.decision}>
      <SegmentedControl<DecisionKind>
        label={t('clinical.refills.decision')}
        value={form.kind}
        onChange={(kind) => setForm({ ...form, kind })}
        options={DECISIONS.map((d) => ({ value: d, label: t(`clinical.refills.decisions.${d}`) }))}
      />
      <Fields form={form} showProblem={tried} onForm={setForm} />
      <TextField
        label={t('clinical.refills.message')}
        value={form.message}
        onValue={(message) => setForm({ ...form, message })}
      />
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <div className={styles.buttons}>
        <Button variant={form.kind === 'decline' ? 'danger' : 'primary'} disabled={busy} onClick={() => onSubmit(form)}>
          {busy ? t('clinical.refills.working') : t(`clinical.refills.submit.${form.kind}`)}
        </Button>
      </div>
    </div>
  )
}

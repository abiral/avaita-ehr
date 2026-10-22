import type { PractitionerId } from '@/core/branded'
import type { Practitioner } from '@/domain/scheduling/types'
import type { TimeOffDraft } from '@/domain/scheduling/timeOffRange'
import { t } from '@/i18n'
import { Banner, Button, Field, Select } from '@/ui'
import styles from '../TimeOff.module.css'
import { Handling, KindAndDates, ReasonAndNote } from './BlockTimeFields'

export interface BlockTimeFormProps {
  readonly draft: TimeOffDraft
  readonly doctors: readonly Practitioner[]
  readonly error: string | null
  readonly busy: boolean
  readonly onChange: (patch: Partial<TimeOffDraft>) => void
  readonly onCheck: () => void
}

/** A2: block full days, part of a day or recurring time; the handling choice is required. */
export function BlockTimeForm({ draft, doctors, error, busy, onChange, onCheck }: BlockTimeFormProps) {
  return (
    <div className={styles.stack}>
      {error ? <Banner tone="critical">{error}</Banner> : null}
      <Field label={t('admin.leave.doctor')} compact>
        {(c) => (
          <Select
            {...c}
            value={draft.practitionerId ?? ''}
            onChange={(e) => onChange({ practitionerId: e.target.value as PractitionerId })}
            options={doctors.map((d) => ({ value: d.id, label: d.displayName }))}
          />
        )}
      </Field>
      <KindAndDates draft={draft} onChange={onChange} />
      <ReasonAndNote draft={draft} onChange={onChange} />
      <Handling draft={draft} doctors={doctors} onChange={onChange} />
      <Button variant="primary" disabled={busy} onClick={onCheck}>
        {t('admin.leave.check')}
      </Button>
    </div>
  )
}

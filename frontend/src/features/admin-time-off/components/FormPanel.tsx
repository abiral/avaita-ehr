import type { TimeOffFormState } from '@/domain/scheduling'
import type { Practitioner } from '@/domain/scheduling/types'
import type { TimeOffDraft } from '@/domain/scheduling/timeOffRange'
import { t } from '@/i18n'
import { Button, Card, Tag } from '@/ui'
import styles from '../TimeOff.module.css'
import { BlockTimeForm } from './BlockTimeForm'
import { ImpactPanel } from './ImpactPanel'

export interface FormPanelProps {
  readonly form: TimeOffFormState
  readonly draft: TimeOffDraft
  readonly doctors: readonly Practitioner[]
  readonly range: string
  readonly timeZone: string
  readonly onChange: (patch: Partial<TimeOffDraft>) => void
  readonly actions: {
    readonly check: () => void
    readonly confirm: () => void
    readonly back: () => void
    readonly again: () => void
  }
}

function Body({ form, draft, doctors, range, timeZone, onChange, actions }: FormPanelProps) {
  switch (form.status) {
    case 'editing':
    case 'checking':
      return (
        <BlockTimeForm
          draft={draft}
          doctors={doctors}
          error={form.status === 'editing' ? form.error : null}
          busy={form.status === 'checking'}
          onChange={onChange}
          onCheck={actions.check}
        />
      )
    case 'previewing-impact':
    case 'saving':
      return (
        <ImpactPanel
          impact={form.impact}
          draft={draft}
          range={range}
          doctors={doctors}
          timeZone={timeZone}
          busy={form.status === 'saving'}
          onBack={actions.back}
          onConfirm={actions.confirm}
        />
      )
    case 'saved': {
      const doctor = doctors.find((d) => d.id === draft.practitionerId)?.displayName ?? ''
      return (
        <div className={styles.saved}>
          <Tag tone="info">{t('admin.leave.saved')}</Tag>
          <span>{t('admin.leave.savedText', { doctor, range, count: form.impact.affected.length })}</span>
          <Button onClick={actions.again}>{t('admin.leave.again')}</Button>
        </div>
      )
    }
  }
}

/** The "Block time" aside in each of its states. */
export function FormPanel(props: FormPanelProps) {
  return (
    <Card as="aside" labelledBy="bt" className={styles.aside}>
      <h2 id="bt" className={styles.title}>
        {t('admin.leave.formTitle')}
      </h2>
      <Body {...props} />
    </Card>
  )
}

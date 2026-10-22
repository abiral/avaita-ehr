import type { SubmitEvent } from 'react'
import type { Weekday } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Button, Card } from '@/ui'
import styles from '../Availability.module.css'
import { slotsPerDay, type BlockForm } from '../model/blockForm'
import { DayChips, SlotOptions, TimeAndMode } from './BlockFields'

export interface NewBlockFormProps {
  readonly doctorName: string
  readonly form: BlockForm
  readonly problem: string | null
  readonly busy: boolean
  readonly onChange: (patch: Partial<BlockForm>) => void
  readonly onSubmit: () => void
}

const day = (d: Weekday) => t(`admin.days.${d}`)

export const previewText = (form: BlockForm): string => {
  if (form.days.length === 0) return t('admin.blocks.chooseDay')
  const mode = t(`admin.modes.${form.mode}`)
  return t('admin.blocks.preview', {
    count: slotsPerDay(form),
    length: form.slotMinutes,
    days: form.days.map(day).join(', '),
    start: form.start,
    end: form.end,
    mode,
  })
}

const problemText = (kind: string, form: BlockForm): string =>
  t(`admin.blocks.problems.${kind as 'overlap'}`, {
    length: form.slotMinutes,
    day: form.days.map(day).join(', '),
    with: '',
  })

/** A1: new block for the selected doctor with a live preview of the slots it creates. */
export function NewBlockForm({ doctorName, form, problem, busy, onChange, onSubmit }: NewBlockFormProps) {
  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <Card as="aside" labelledBy="nb" className={styles.aside}>
      <form className={styles.form} onSubmit={submit} noValidate aria-labelledby="nb">
        <div className={styles.formHead}>
          <h2 id="nb" className={styles.formTitle}>
            {t('admin.blocks.newTitle')}
          </h2>
          <span className={styles.ruleHint}>{t('admin.blocks.newFor', { doctor: doctorName })}</span>
        </div>
        <DayChips form={form} onChange={onChange} />
        <TimeAndMode form={form} onChange={onChange} />
        <SlotOptions form={form} onChange={onChange} />
        <p className={styles.preview} aria-live="polite">
          {previewText(form)}
        </p>
        {problem ? (
          <p className={styles.problem} role="alert">
            {problemText(problem, form)}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={busy || form.days.length === 0 || slotsPerDay(form) === 0}>
          {t('admin.blocks.save')}
        </Button>
      </form>
    </Card>
  )
}

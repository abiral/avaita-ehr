import { BLOCK_MODES, WEEKDAYS, type Weekday } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Field, SegmentedControl, Select, TextInput } from '@/ui'
import styles from '../Availability.module.css'
import { HOURS, ROOMS, SLOT_LENGTHS, toggleDay, type BlockForm, type RoomKey } from '../model/blockForm'

export interface BlockFieldsProps {
  readonly form: BlockForm
  readonly onChange: (patch: Partial<BlockForm>) => void
}

const day = (d: Weekday) => t(`admin.days.${d}`)
const HOUR_OPTIONS = HOURS.map((h) => ({ value: h, label: h }))
const REPEATS = (['weekly', 'biweekly', 'once'] as const).map((r) => ({
  value: r,
  label: () => t(`admin.blocks.repeat.${r}`),
}))

export function DayChips({ form, onChange }: BlockFieldsProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>{t('admin.blocks.daysLabel')}</legend>
      <div className={styles.dayChips}>
        {WEEKDAYS.map((d) => (
          <button
            key={d}
            type="button"
            className={styles.dayChip}
            aria-pressed={form.days.includes(d)}
            onClick={() => onChange({ days: toggleDay(form.days, d) })}
          >
            {day(d)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function TimeAndMode({ form, onChange }: BlockFieldsProps) {
  return (
    <>
      <div className={styles.two}>
        <Field label={t('admin.blocks.start')} compact>
          {(c) => (
            <Select
              {...c}
              options={HOUR_OPTIONS}
              value={form.start}
              onChange={(e) => onChange({ start: e.target.value })}
            />
          )}
        </Field>
        <Field label={t('admin.blocks.end')} compact>
          {(c) => (
            <Select
              {...c}
              options={HOUR_OPTIONS}
              value={form.end}
              onChange={(e) => onChange({ end: e.target.value })}
            />
          )}
        </Field>
      </div>
      <fieldset className={styles.group}>
        <legend className={styles.groupLabel}>{t('admin.blocks.visitType')}</legend>
        <SegmentedControl
          label={t('admin.blocks.visitType')}
          value={form.mode}
          onChange={(mode) => onChange({ mode })}
          options={BLOCK_MODES.map((m) => ({
            value: m,
            label: m === 'both' ? t('admin.modes.bothShort') : t(`admin.modes.${m}`),
          }))}
        />
      </fieldset>
    </>
  )
}

export function SlotOptions({ form, onChange }: BlockFieldsProps) {
  return (
    <>
      <div className={styles.two}>
        <Field label={t('admin.blocks.slotLength')} compact>
          {(c) => (
            <Select
              {...c}
              options={SLOT_LENGTHS.map((n) => ({ value: String(n), label: t('admin.blocks.minutes', { n }) }))}
              value={String(form.slotMinutes)}
              onChange={(e) => onChange({ slotMinutes: Number(e.target.value) })}
            />
          )}
        </Field>
        <Field label={t('admin.blocks.room')} compact>
          {(c) => (
            <Select
              {...c}
              options={ROOMS.map((r) => ({ value: r, label: t(`admin.blocks.rooms.${r}`) }))}
              value={form.room}
              disabled={form.mode === 'remote'}
              onChange={(e) => onChange({ room: e.target.value as RoomKey })}
            />
          )}
        </Field>
      </div>
      <div className={styles.two}>
        <Field label={t('admin.blocks.repeats')} compact>
          {(c) => (
            <Select
              {...c}
              options={REPEATS.map((r) => ({ value: r.value, label: r.label() }))}
              value={form.repeat}
              onChange={(e) => onChange({ repeat: e.target.value as BlockForm['repeat'] })}
            />
          )}
        </Field>
        <Field label={t('admin.blocks.starts')} compact>
          {(c) => (
            <TextInput
              {...c}
              type="date"
              value={form.startsOn}
              onChange={(e) => onChange({ startsOn: e.target.value })}
            />
          )}
        </Field>
      </div>
    </>
  )
}

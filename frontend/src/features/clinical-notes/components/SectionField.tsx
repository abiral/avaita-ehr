import type { NoteSectionKey } from '@/domain/clinical'
import { t } from '@/i18n'
import styles from '../Notes.module.css'

export interface SectionFieldProps {
  readonly name: NoteSectionKey
  readonly value: string
  readonly readOnly: boolean
  readonly error?: string | undefined
  readonly onChange: (value: string) => void
}

/** One free-text section of the note, with its own label. */
export function SectionField({ name, value, readOnly, error, onChange }: SectionFieldProps) {
  const id = `note-${name}`
  return (
    <div className={styles.sec}>
      <label htmlFor={id} className={styles.secLabel}>
        {t(`clinical.note.sections.${name}`)}
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        rows={name === 'assessment' ? 3 : 2}
        value={value}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  )
}

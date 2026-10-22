import { useId, type ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Form.module.css'

export interface FieldControlProps {
  readonly id: string
  readonly 'aria-describedby'?: string
  readonly 'aria-invalid'?: boolean
}

export interface FieldProps {
  readonly label: string
  readonly hint?: string | undefined
  readonly error?: string | undefined
  readonly compact?: boolean
  readonly aside?: ReactNode
  readonly children: (control: FieldControlProps) => ReactNode
}

/** Label, hint and error wired to the control by id. Errors are announced politely. */
export function Field({ label, hint, error, compact = false, aside, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ')
  const control: FieldControlProps = {
    id,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(error ? { 'aria-invalid': true } : {}),
  }
  return (
    <div className={cx(styles.field, compact && styles.compact)}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {aside}
      </div>
      {children(control)}
      {hint ? (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      ) : null}
      <span id={errorId} className={styles.error} aria-live="polite">
        {error}
      </span>
    </div>
  )
}

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import styles from './CodeInput.module.css'

export interface CodeInputProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly length: number
  readonly groupLabel: string
  readonly digitLabel: (n: number) => string
  readonly invalid?: boolean
}

/** One-time code entry: one box per digit, moves focus forward and back, accepts paste. */
export function CodeInput({ value, onChange, length, groupLabel, digitLabel, invalid = false }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const setAt = (i: number, d: string) => {
    const next = digits.map((x, j) => (j === i ? d : x)).join('')
    onChange(next.slice(0, length))
    if (d && i < length - 1) refs.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    onChange(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }
  return (
    <div className={styles.group} role="group" aria-label={groupLabel}>
      {digits.map((d, i) => (
        <input
          // Positions never reorder.

          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={styles.digit}
          aria-label={digitLabel(i + 1)}
          aria-invalid={invalid || undefined}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          onChange={(e) => {
            setAt(i, e.target.value.replace(/\D/g, '').slice(-1))
          }}
          onKeyDown={(e) => {
            onKey(i, e)
          }}
          onPaste={onPaste}
        />
      ))}
    </div>
  )
}

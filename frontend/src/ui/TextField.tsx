import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field } from './Field'
import { TextInput } from './TextInput'

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'size' | 'onChange' | 'value' | 'id'
> {
  readonly label: string
  readonly value: string
  readonly onValue: (value: string) => void
  readonly hint?: string | undefined
  readonly error?: string | undefined
  readonly aside?: ReactNode
  readonly size?: 'sm' | 'md' | 'lg'
  readonly compact?: boolean
}

/** Field plus text input in one: label, hint and error are wired to the input. */
export function TextField({
  label,
  value,
  onValue,
  hint,
  error,
  aside,
  size = 'md',
  compact = false,
  ...rest
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} aside={aside} compact={compact}>
      {(c) => <TextInput {...c} {...rest} size={size} value={value} onChange={(e) => onValue(e.target.value)} />}
    </Field>
  )
}

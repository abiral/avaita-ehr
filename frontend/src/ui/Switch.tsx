import styles from './Form.module.css'

export interface SwitchProps {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label: string
  readonly disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      onClick={() => {
        onChange(!checked)
      }}
    />
  )
}

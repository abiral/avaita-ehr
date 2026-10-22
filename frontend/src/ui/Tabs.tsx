import { useRef, type KeyboardEvent } from 'react'
import styles from './Tabs.module.css'

export interface TabItem<V extends string> {
  readonly value: V
  readonly label: string
  readonly count?: number
}

export interface TabsProps<V extends string> {
  readonly label: string
  readonly value: V
  readonly items: readonly TabItem<V>[]
  readonly onChange: (value: V) => void
  /** Id prefix; panels use `${idPrefix}-panel`. */
  readonly idPrefix: string
}

/** ARIA tabs with arrow-key navigation. Render the panel with id `${idPrefix}-panel`. */
export function Tabs<V extends string>({ label, value, items, onChange, idPrefix }: TabsProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    const next = (index + delta + items.length) % items.length
    const item = items[next]
    if (!item) return
    onChange(item.value)
    refs.current[next]?.focus()
  }
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((item, i) => (
        <button
          key={item.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-${item.value}`}
          aria-selected={item.value === value}
          aria-controls={`${idPrefix}-panel`}
          tabIndex={item.value === value ? 0 : -1}
          className={styles.tab}
          onClick={() => {
            onChange(item.value)
          }}
          onKeyDown={(e) => {
            onKey(e, i)
          }}
        >
          {item.label}
          {item.count === undefined ? null : ' '}
          {item.count === undefined ? null : <span className={styles.count}>{item.count}</span>}
        </button>
      ))}
    </div>
  )
}

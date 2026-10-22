import { useId, useState, type KeyboardEvent } from 'react'
import styles from './Combobox.module.css'
import { SearchInput } from './SearchInput'

export interface ComboOption {
  readonly id: string
  readonly label: string
  readonly meta?: string
}

export interface ComboboxProps {
  readonly label: string
  readonly placeholder?: string
  readonly query: string
  readonly onQueryChange: (q: string) => void
  readonly options: readonly ComboOption[]
  readonly onSelect: (option: ComboOption) => void
  readonly emptyText: string
  readonly size?: 'md' | 'lg'
}

interface ListProps {
  readonly id: string
  readonly label: string
  readonly options: readonly ComboOption[]
  readonly active: number
  readonly emptyText: string
  readonly onChoose: (o: ComboOption) => void
}

function OptionList({ id, label, options, active, emptyText, onChoose }: ListProps) {
  return (
    <div id={id} role="listbox" aria-label={label} className={styles.list}>
      {options.length === 0 ? <div className={styles.none}>{emptyText}</div> : null}
      {options.map((o, i) => (
        <div
          key={o.id}
          id={`${id}-${o.id}`}
          role="option"
          tabIndex={-1}
          aria-selected={i === active}
          className={styles.option}
          onMouseDown={(e) => {
            e.preventDefault()
            onChoose(o)
          }}
        >
          <span>{o.label}</span>
          {o.meta ? <span className={styles.optionMeta}>{o.meta}</span> : null}
        </div>
      ))}
    </div>
  )
}

const step = (key: string): number => (key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0)

/** ARIA 1.2 combobox with a listbox popup: arrow keys move, Enter selects, Escape closes. */
export function Combobox(props: ComboboxProps) {
  const { label, placeholder, query, onQueryChange, options, onSelect, emptyText, size = 'md' } = props
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const show = open && query.trim().length > 0
  const choose = (o: ComboOption | undefined) => {
    if (!o) return
    onSelect(o)
    setOpen(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const delta = step(e.key)
    if (delta) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (options.length ? (i + delta + options.length) % options.length : 0))
    } else if (e.key === 'Enter' && show) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') setOpen(false)
  }
  const activeOption = show ? options[active] : undefined
  return (
    <div className={styles.wrap}>
      <SearchInput
        label={label}
        size={size}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false)
        }}
      />
      {show ? (
        <OptionList
          id={listId}
          label={label}
          options={options}
          active={active}
          emptyText={emptyText}
          onChoose={choose}
        />
      ) : null}
    </div>
  )
}

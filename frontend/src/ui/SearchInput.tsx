import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/shared/cx'
import styles from './Misc.module.css'
import { Icon } from './icons/Icon'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'size'> {
  /** Required accessible name. */
  readonly label: string
  readonly size?: 'md' | 'lg'
  readonly suffix?: ReactNode
}

/** Clinical search: autocomplete off so search terms are never stored by the browser. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, size = 'md', suffix, ...rest },
  ref,
) {
  return (
    <label className={cx(styles.search, size === 'lg' && styles.searchLg)}>
      <Icon name="search" size={16} strokeWidth={1.6} />
      <input ref={ref} type="search" aria-label={label} autoComplete="off" spellCheck={false} {...rest} />
      {suffix}
    </label>
  )
})

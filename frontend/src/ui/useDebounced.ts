import { useEffect, useState } from 'react'

/** The value after it has been stable for `ms` (search as you type). */
export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value)
    }, ms)
    return () => {
      clearTimeout(id)
    }
  }, [value, ms])
  return debounced
}

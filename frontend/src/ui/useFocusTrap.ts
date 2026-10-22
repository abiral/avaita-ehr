import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab inside `ref`, closes on Escape and returns focus to the opener on unmount. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape: () => void): void {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const node = ref.current
    const items = () => (node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : [])
    const initial = node?.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0] ?? node
    initial?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const list = items()
      const first = list[0]
      const last = list[list.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    node?.addEventListener('keydown', onKey)
    return () => {
      node?.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [ref, onEscape])
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'

export interface ToastInput {
  readonly message: string
  readonly action?: { readonly label: string; readonly onAction: () => void }
  readonly durationMs?: number
}
interface ToastItem extends ToastInput {
  readonly id: number
}
interface ToastApi {
  show(toast: ToastInput): void
}

const ToastContext = createContext<ToastApi | null>(null)

function ToastView({
  item,
  onDone,
  dismissLabel,
}: {
  item: ToastItem
  onDone: (id: number) => void
  dismissLabel: string
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone(item.id)
    }, item.durationMs ?? 8000)
    return () => {
      clearTimeout(timer)
    }
  }, [item, onDone])
  return (
    <div className={styles.toast}>
      <span>{item.message}</span>
      <span className={styles.actions}>
        {item.action ? (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              item.action?.onAction()
              onDone(item.id)
            }}
          >
            {item.action.label}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            onDone(item.id)
          }}
        >
          {dismissLabel}
        </button>
      </span>
    </div>
  )
}

/** Toasts render in a polite status region. */
export function ToastProvider({
  children,
  dismissLabel,
}: {
  readonly children: ReactNode
  readonly dismissLabel: string
}) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const remove = useCallback((id: number) => {
    setItems((all) => all.filter((t) => t.id !== id))
  }, [])
  const api = useMemo<ToastApi>(
    () => ({
      show(toast) {
        const id = nextId.current++
        setItems((all) => [...all, { ...toast, id }])
      },
    }),
    [],
  )
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDone={remove} dismissLabel={dismissLabel} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast needs ToastProvider')
  return api
}

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmOptions {
  readonly title: string
  readonly description?: ReactNode
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly tone?: 'primary' | 'danger'
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>
const ConfirmContext = createContext<Confirm | null>(null)

/** Provides `useConfirm()`: a promise-based confirmation dialog. */
export function ConfirmProvider({ children }: { readonly children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  const confirm = useCallback<Confirm>((next) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])
  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOptions(null)
  }, [])
  const value = useMemo(() => confirm, [confirm])
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options ? (
        <Modal
          role="alertdialog"
          title={options.title}
          description={options.description}
          closeLabel={options.cancelLabel}
          onClose={() => {
            settle(false)
          }}
          footer={
            <>
              <Button
                onClick={() => {
                  settle(false)
                }}
              >
                {options.cancelLabel}
              </Button>
              <Button
                variant={options.tone ?? 'primary'}
                data-autofocus
                onClick={() => {
                  settle(true)
                }}
              >
                {options.confirmLabel}
              </Button>
            </>
          }
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm needs ConfirmProvider')
  return confirm
}

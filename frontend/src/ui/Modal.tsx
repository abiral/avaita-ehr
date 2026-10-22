import { useCallback, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/shared/cx'
import styles from './Modal.module.css'
import { IconButton } from './IconButton'
import { useFocusTrap } from './useFocusTrap'

export interface ModalProps {
  readonly title: string
  readonly description?: ReactNode
  readonly onClose: () => void
  readonly closeLabel: string
  readonly children?: ReactNode
  readonly footer?: ReactNode
  readonly wide?: boolean
  readonly role?: 'dialog' | 'alertdialog'
}

/** Modal dialog: focus trap, Escape to close, focus returns to the opener. */
export function Modal({
  title,
  description,
  onClose,
  closeLabel,
  children,
  footer,
  wide = false,
  role = 'dialog',
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const close = useCallback(() => {
    onClose()
  }, [onClose])
  useFocusTrap(ref, close)
  return createPortal(
    <div className={styles.backdrop}>
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cx(styles.dialog, wide && styles.wide)}
        tabIndex={-1}
      >
        <div className={styles.head}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descId} className={styles.desc}>
                {description}
              </p>
            ) : null}
          </div>
          <IconButton icon="close" label={closeLabel} onClick={close} />
        </div>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.foot}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

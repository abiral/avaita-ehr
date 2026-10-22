import { t } from '@/i18n'
import { Banner, StatusMessage } from '@/ui'
import type { Notice } from '../model/useMyAppointments'
import styles from '../MyAppointments.module.css'

/** Confirmation after cancelling, with Undo; errors use a banner. */
export function NoticeBar({ notice, onUndo }: { readonly notice: Notice; readonly onUndo: () => void }) {
  if (!notice) return null
  if (notice.kind === 'error') return <Banner tone="critical">{notice.text}</Banner>
  if (notice.kind === 'restored') return <StatusMessage>{t('portal.appointments.restored')}</StatusMessage>
  return (
    <div role="status" className={styles.notice}>
      <span>{t('portal.appointments.cancelled', { when: notice.day })}</span>
      <button type="button" className={styles.undo} onClick={onUndo}>
        {t('portal.appointments.undo')}
      </button>
    </div>
  )
}

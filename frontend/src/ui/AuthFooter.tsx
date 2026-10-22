import type { ReactNode } from 'react'
import { t } from '@/i18n'
import styles from './AuthFooter.module.css'

/** The privacy note and help links under the sign-in card (P1). */
export function AuthFooter() {
  return (
    <>
      <p className={styles.note}>{t('shell.auth.secure')}</p>
      <nav className={styles.links} aria-label={t('common.footer.help')}>
        <a href="/help">{t('common.footer.help')}</a>
        <a href="/status">{t('common.footer.status')}</a>
        <a href="/privacy">{t('common.footer.privacy')}</a>
      </nav>
    </>
  )
}

/** A line of text under an auth card ("Have an account? Sign in"). */
export function AuthBelow({ children }: { readonly children: ReactNode }) {
  return <p className={styles.below}>{children}</p>
}

export const authBackClass = styles.back ?? ''

import { Outlet } from 'react-router'
import { t } from '@/i18n'
import { Logo } from '@/ui'
import styles from './Shell.module.css'
import { SkipLink } from './SkipLink'

/** Centered card on a dotted background (P1, P2, P3). */
export function AuthShell() {
  return (
    <div className={styles.auth}>
      <SkipLink />
      <Logo size="lg" />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <p className={styles.authNote}>{t('shell.auth.secure')}</p>
      <nav className={styles.authLinks} aria-label={t('common.footer.help')}>
        <a href="/help">{t('common.footer.help')}</a>
        <a href="/status">{t('common.footer.status')}</a>
        <a href="/privacy">{t('common.footer.privacy')}</a>
      </nav>
    </div>
  )
}

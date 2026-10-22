import { Link, Outlet } from 'react-router'
import { t } from '@/i18n'
import { Logo } from '@/ui'
import { paths } from '../routes'
import styles from './Shell.module.css'
import { SkipLink } from './SkipLink'

/** Dotted background with the logo above a centered card (P1, P2, P3). */
export function AuthShell() {
  return (
    <div className={styles.auth}>
      <SkipLink />
      <Link to={paths.login} className={styles.authBrand} aria-label={t('common.appName')}>
        <Logo size="lg" />
      </Link>
      <main id="main" tabIndex={-1} className={`${styles.main ?? ''} ${styles.authMain ?? ''}`}>
        <Outlet />
      </main>
    </div>
  )
}

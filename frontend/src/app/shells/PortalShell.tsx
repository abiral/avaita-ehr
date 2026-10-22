import { Link, NavLink, Outlet } from 'react-router'
import { initials } from '@/domain/identity'
import { t } from '@/i18n'
import { Avatar, Logo, TextAction } from '@/ui'
import { paths } from '../routes'
import { useSession } from '../session/SessionProvider'
import { sessionOf } from '../session/sessionState'
import styles from './Shell.module.css'
import { SkipLink } from './SkipLink'

const NAV = [
  { to: paths.portal.home, label: 'shell.portal.home', end: true },
  { to: paths.portal.appointments, label: 'shell.portal.appointments', end: false },
  { to: paths.portal.reports, label: 'shell.portal.reports', end: false },
  { to: paths.portal.medicines, label: 'shell.portal.medicines', end: false },
] as const

/** Top bar with logo, nav and the patient (P4 to P9). */
export function PortalShell() {
  const { state, signOut } = useSession()
  const session = sessionOf(state)
  const patient = session?.kind === 'patient' ? session : null
  return (
    <div className={styles.portal}>
      <SkipLink />
      <header className={styles.portalHeader}>
        <div className={styles.portalBar}>
          <div className={styles.portalLeft}>
            <Link to={paths.portal.home} className={styles.brand} aria-label={t('common.appName')}>
              <Logo />
            </Link>
            <nav className={styles.pnav} aria-label={t('shell.portal.nav')}>
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          {patient ? (
            <div className={styles.account}>
              <Avatar initials={initials(patient.displayName)} />
              <span className={styles.who}>
                <span className={styles.whoName}>{patient.displayName}</span>
                <span className={`mono ${styles.whoMeta ?? ''}`}>{patient.mrn}</span>
              </span>
              <TextAction onClick={() => void signOut()}>{t('common.signOut')}</TextAction>
            </div>
          ) : null}
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

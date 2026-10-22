import { Outlet } from 'react-router'
import { t } from '@/i18n'
import { Logo, SearchInput, Tag } from '@/ui'
import { Link } from 'react-router'
import { paths } from '../routes'
import { FacilitySwitcher } from './FacilitySwitcher'
import styles from './Shell.module.css'
import { SideNav } from './SideNav'
import { SkipLink } from './SkipLink'
import { UserBlock } from './UserBlock'
import { useStaffContext } from './useStaffContext'

/** Same sidebar pattern with an Admin tag and grouped nav (A1 to A4). */
export function AdminShell() {
  const { staff, tenant, signOut } = useStaffContext()
  return (
    <div className={styles.staff}>
      <SkipLink />
      <aside className={styles.sidebar}>
        <div className={styles.sideBrand}>
          <Logo />
          <span className={styles.adminTag}>
            <Tag>{t('common.admin')}</Tag>
          </span>
        </div>
        <FacilitySwitcher name={tenant.facility?.shortName ?? ''} meta={t('shell.admin.console')} />
        <SideNav
          label={t('shell.admin.scheduling')}
          caption={t('shell.admin.scheduling')}
          items={[
            { to: paths.admin.availability, label: t('shell.admin.blocks') },
            { to: paths.admin.timeOff, label: t('shell.admin.timeOff') },
          ]}
        />
        <SideNav
          label={t('shell.admin.services')}
          caption={t('shell.admin.services')}
          items={[{ to: paths.admin.packages, label: t('shell.admin.packages') }]}
        />
        <SideNav
          label={t('shell.admin.organization')}
          caption={t('shell.admin.organization')}
          items={[{ to: paths.admin.organization, label: t('shell.admin.facilities') }]}
        />
        <Link to={paths.staff.today} className={styles.sideFoot}>
          {t('shell.admin.openWorkspace')}
        </Link>
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.searchBox}>
            <SearchInput label={t('shell.admin.search')} placeholder={t('shell.admin.searchPlaceholder')} />
          </div>
          {staff ? (
            <UserBlock
              name={staff.displayName}
              role={tenant.membership?.role ?? staff.title}
              onSignOut={() => void signOut()}
            />
          ) : null}
        </header>
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

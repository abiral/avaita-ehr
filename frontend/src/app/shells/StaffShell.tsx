import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { t } from '@/i18n'
import { IconButton, Logo } from '@/ui'
import { paths } from '../routes'
import { FacilitySwitcher } from './FacilitySwitcher'
import styles from './Shell.module.css'
import { SideNav } from './SideNav'
import { SkipLink } from './SkipLink'
import { isOrgAdmin, staffNavItems, switcherMeta, type NavCounts } from './staffNav'
import { UserBlock } from './UserBlock'
import { useStaffContext } from './useStaffContext'

export interface StaffShellSlots {
  readonly search?: ReactNode
  readonly banner?: ReactNode
  readonly counts?: NavCounts
}

/** Left sidebar with facility switcher and nav, top bar with patient search and user (C2 to C9). */
export function StaffShell({ search, banner, counts = {} }: StaffShellSlots) {
  const { staff, tenant, signOut } = useStaffContext()
  return (
    <div className={styles.staff}>
      <SkipLink />
      <aside className={styles.sidebar}>
        <div className={styles.sideBrand}>
          <Logo />
        </div>
        <FacilitySwitcher name={tenant.facility?.shortName ?? ''} meta={switcherMeta(tenant)} />
        <SideNav label={t('shell.staff.primaryNav')} items={staffNavItems(counts)} />
        {isOrgAdmin(staff, tenant) ? (
          <SideNav
            label={t('shell.staff.organizationNav')}
            caption={t('shell.staff.organizationCap')}
            items={[{ to: paths.admin.organization, label: t('shell.staff.facilities') }]}
          />
        ) : null}
      </aside>
      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.searchBox}>{search}</div>
          <div className={styles.topRight}>
            <IconButton icon="bell" label={t('common.notifications')} />
            <span className={styles.divider} />
            {staff ? <UserBlock name={staff.displayName} role={staff.title} onSignOut={() => void signOut()} /> : null}
          </div>
        </header>
        {banner ? <div className={styles.criticalWrap}>{banner}</div> : null}
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

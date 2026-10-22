import { can, type StaffSession } from '@/domain/identity'
import { t } from '@/i18n'
import { paths } from '../routes'
import type { TenantApi } from '../TenantProvider'
import type { SideNavItem } from './SideNav'

export type NavCounts = Partial<Record<'patients' | 'results' | 'medicationRequests', number>>

export const staffNavItems = (counts: NavCounts): SideNavItem[] => [
  { to: paths.staff.today, label: t('shell.staff.today'), end: true },
  { to: paths.staff.patients, label: t('shell.staff.patients'), count: counts.patients },
  { to: paths.staff.schedule, label: t('shell.staff.schedule') },
  { to: paths.staff.results, label: t('shell.staff.results'), count: counts.results },
  { to: paths.staff.medicationRequests, label: t('shell.staff.medicationRequests'), count: counts.medicationRequests },
]

export const isOrgAdmin = (staff: StaffSession | null, tenant: TenantApi): boolean =>
  staff !== null && tenant.scope !== null && can(staff, tenant.scope.facilityId, 'org:admin')

export const switcherMeta = (tenant: TenantApi): string => {
  const dept = tenant.department
  if (dept) return dept.unit ? `${dept.name} · ${dept.unit}` : dept.name
  return tenant.membership?.role ?? ''
}

import { t } from '@/i18n'
import { SearchInput } from '@/ui'
import { CriticalAlerts } from '../chart/CriticalAlerts'
import { useCriticalAlerts } from '../chart/useCriticalAlerts'
import { StaffShell } from './StaffShell'

/** Fills the staff shell slots (patient search, critical results banner, nav counts). */
export function StaffShellRoute() {
  const alerts = useCriticalAlerts()
  return (
    <StaffShell
      search={<SearchInput label={t('shell.staff.searchPatients')} placeholder={t('shell.staff.searchPlaceholder')} />}
      banner={alerts.length > 0 ? <CriticalAlerts alerts={alerts} /> : null}
    />
  )
}

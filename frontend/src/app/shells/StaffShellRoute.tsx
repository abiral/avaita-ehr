import { CriticalAlerts } from '../chart/CriticalAlerts'
import { useCriticalAlerts } from '../chart/useCriticalAlerts'
import { PatientSearch } from './PatientSearch'
import { StaffShell } from './StaffShell'
import { useNavCounts } from './useNavCounts'

/** Fills the staff shell slots: patient search, critical results banner and nav counts. */
export function StaffShellRoute() {
  const alerts = useCriticalAlerts()
  const counts = useNavCounts()
  return (
    <StaffShell
      search={<PatientSearch />}
      banner={alerts.length > 0 ? <CriticalAlerts alerts={alerts} /> : null}
      counts={counts}
    />
  )
}

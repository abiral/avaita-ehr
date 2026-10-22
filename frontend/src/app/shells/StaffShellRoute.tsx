import { t } from '@/i18n'
import { SearchInput } from '@/ui'
import { StaffShell } from './StaffShell'

/** Fills the staff shell slots (patient search, critical results banner, nav counts). */
export function StaffShellRoute() {
  return (
    <StaffShell
      search={<SearchInput label={t('shell.staff.searchPatients')} placeholder={t('shell.staff.searchPlaceholder')} />}
    />
  )
}

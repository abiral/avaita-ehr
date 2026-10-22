import type { FacilityDetail } from '@/domain/identity'
import { t } from '@/i18n'
import styles from '../Workspace.module.css'

export interface FacilityOptionProps {
  readonly facility: FacilityDetail
  readonly selected: boolean
  readonly onPick: () => void
}

export function FacilityOption({ facility, selected, onPick }: FacilityOptionProps) {
  const disabled = facility.status !== 'live' || facility.membershipNote === null
  return (
    <button type="button" className={styles.opt} aria-pressed={selected} disabled={disabled} onClick={onPick}>
      <span className={styles.optTop}>
        <span className={styles.name}>{facility.name}</span>
        <span className={styles.ring} aria-hidden="true" />
      </span>
      <span className={styles.kind}>{facility.kind}</span>
      <span className={styles.meta}>{disabled ? t('auth.workspace.afterGoLive') : facility.membershipNote}</span>
    </button>
  )
}

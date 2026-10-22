import type { PractitionerId } from '@/core/branded'
import { initials } from '@/domain/identity'
import type { Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Avatar, Card, EmptyState, SearchInput, SkeletonRows } from '@/ui'
import styles from '../Availability.module.css'

export interface DoctorNavProps {
  readonly doctors: readonly Practitioner[]
  readonly selectedId: PractitionerId | null
  readonly q: string
  readonly loading: boolean
  readonly onQ: (q: string) => void
  readonly onPick: (id: PractitionerId) => void
}

/** Doctor picker shared by A1 and A2. */
export function DoctorNav({ doctors, selectedId, q, loading, onQ, onPick }: DoctorNavProps) {
  return (
    <nav className={styles.nav} aria-label={t('admin.doctors')}>
      <Card>
        <div className={styles.navSearch}>
          <SearchInput
            label={t('admin.findDoctor')}
            placeholder={t('admin.findDoctor')}
            value={q}
            onChange={(e) => onQ(e.target.value)}
          />
        </div>
        {loading ? <SkeletonRows label={t('admin.loadingDoctors')} rows={4} /> : null}
        {!loading && doctors.length === 0 ? <EmptyState title={t('admin.noDoctors')} /> : null}
        {doctors.map((d) => (
          <button
            key={d.id}
            type="button"
            className={styles.doctor}
            aria-pressed={d.id === selectedId}
            onClick={() => onPick(d.id)}
          >
            <Avatar initials={initials(d.displayName)} />
            <span className={styles.who}>
              <span className={styles.whoName}>{d.displayName}</span>
              <span className={styles.whoMeta}>{d.category}</span>
            </span>
          </button>
        ))}
      </Card>
    </nav>
  )
}

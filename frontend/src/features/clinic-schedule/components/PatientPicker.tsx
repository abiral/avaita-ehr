import { t } from '@/i18n'
import { Button, Combobox } from '@/ui'
import styles from '../Schedule.module.css'
import type { usePatientSearch } from '../model/usePatientSearch'

/** Search by name or MRN; once chosen, shows the patient with a Change button. */
export function PatientPicker({ search }: { readonly search: ReturnType<typeof usePatientSearch> }) {
  const { patient } = search
  if (patient)
    return (
      <div className={styles.group}>
        <span className={styles.groupLabel}>{t('staff.bookFor.patient')}</span>
        <div className={styles.chosen}>
          <span>
            {patient.displayName} · <span className={styles.mono}>{patient.mrn}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={search.clear}>
            {t('staff.bookFor.change')}
          </Button>
        </div>
      </div>
    )
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel} aria-hidden="true">
        {t('staff.bookFor.patient')}
      </span>
      <Combobox
        label={t('staff.bookFor.patient')}
        placeholder={t('staff.bookFor.patientPlaceholder')}
        query={search.query}
        onQueryChange={search.setQuery}
        options={search.options.map((p) => ({ id: p.id, label: p.displayName, meta: p.mrn }))}
        onSelect={(o) => {
          search.choose(o.id)
        }}
        emptyText={t('staff.bookFor.noPatients')}
      />
    </div>
  )
}

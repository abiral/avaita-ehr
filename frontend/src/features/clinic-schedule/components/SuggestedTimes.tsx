import { t } from '@/i18n'
import styles from '../Schedule.module.css'
import { slotLabel } from '../model/useBookFor'
import type { Suggestion } from '../model/useSuggestions'

export interface SuggestedTimesProps {
  readonly suggestions: readonly Suggestion[]
  readonly picked: number
  readonly loading: boolean
  readonly showDoctor: boolean
  readonly timeZone: string
  readonly onPick: (index: number) => void
}

/** The earliest open slots as toggle buttons; with "First available" each names its clinician. */
export function SuggestedTimes({ suggestions, picked, loading, showDoctor, timeZone, onPick }: SuggestedTimesProps) {
  return (
    <div className={styles.group} role="group" aria-labelledby="suggested-times">
      <span id="suggested-times" className={styles.groupLabel}>
        {t('staff.bookFor.suggested')}
      </span>
      {loading ? <span className={styles.muted}>{t('staff.bookFor.loadingSlots')}</span> : null}
      {!loading && suggestions.length === 0 ? <span className={styles.muted}>{t('staff.bookFor.noSlots')}</span> : null}
      <div className={styles.slots}>
        {suggestions.map((s, i) => (
          <button
            key={`${s.doctor.id}-${String(s.start.getTime())}`}
            type="button"
            className={styles.slot}
            aria-pressed={i === picked}
            onClick={() => {
              onPick(i)
            }}
          >
            {slotLabel(s, timeZone)}
            {showDoctor ? <span className={styles.slotDoctor}>{s.doctor.displayName}</span> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

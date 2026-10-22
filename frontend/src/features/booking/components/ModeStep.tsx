import { VISIT_MODES, type Practitioner, type VisitMode } from '@/domain/scheduling/types'
import { offersMode } from '@/domain/scheduling/bookable'
import { t } from '@/i18n'
import { Card, Icon } from '@/ui'
import styles from '../Booking.module.css'
import { visitModes } from '../model/visitModes'

export interface ModeStepProps {
  readonly doctor: Practitioner
  readonly facility: string
  readonly mode: VisitMode | null
  readonly onPick: (mode: VisitMode) => void
}

/** P5 step 2: on-site or remote. A mode the doctor does not offer is disabled with the reason. */
export function ModeStep({ doctor, facility, mode, onPick }: ModeStepProps) {
  return (
    <Card className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('portal.booking.modeTitle', { doctor: doctor.displayName })}</h2>
        <span className={styles.sub}>{t('portal.booking.modeSub')}</span>
      </div>
      <div className={styles.options}>
        {VISIT_MODES.map((m) => {
          const cfg = visitModes[m]
          const offered = offersMode(doctor, m)
          return (
            <button
              key={m}
              type="button"
              className={styles.opt}
              aria-pressed={mode === m}
              disabled={!offered}
              onClick={() => onPick(m)}
            >
              <span className={styles.optIcon}>
                <Icon name={cfg.icon} size={20} />
              </span>
              <span className={styles.optName}>{cfg.name()}</span>
              <span className={styles.optDesc}>{cfg.description(doctor.location, facility)}</span>
              <span className={styles.optMeta}>{offered ? cfg.meta() : t('portal.booking.notOffered')}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

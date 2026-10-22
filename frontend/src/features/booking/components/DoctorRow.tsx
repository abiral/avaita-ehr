import type { Practitioner } from '@/domain/scheduling/types'
import { initials } from '@/domain/identity'
import { formatShortDay, formatTime, t } from '@/i18n'
import { Avatar, Button, Tag } from '@/ui'
import styles from '../Booking.module.css'
import { visitModes } from '../model/visitModes'

export interface DoctorRowProps {
  readonly doctor: Practitioner
  readonly today: string
  readonly timeZone: string
  readonly dateOf: (d: Date) => string
  readonly onSelect: () => void
}

const nextText = (d: Date | null, today: string, dateOf: (d: Date) => string, tz: string): string => {
  if (!d) return t('portal.booking.noneAvailable')
  return dateOf(d) === today ? t('portal.booking.today', { time: formatTime(d, tz) }) : formatShortDay(d, tz)
}

export function DoctorRow({ doctor, today, timeZone, dateOf, onSelect }: DoctorRowProps) {
  const modes = [
    doctor.offersOnsite ? visitModes.onsite.tag() : null,
    doctor.offersRemote ? visitModes.remote.tag() : null,
  ].filter((m) => m !== null)
  return (
    <div className={styles.doc}>
      <Avatar initials={initials(doctor.displayName)} size="lg" />
      <span className={styles.docInfo}>
        <span className={styles.docName}>{doctor.displayName}</span>
        <span className={styles.docMeta}>
          {doctor.category} · {doctor.qualifications}
        </span>
        <span className={styles.small}>{t('portal.booking.speaks', { languages: doctor.languages.join(', ') })}</span>
        <span className={styles.tags}>
          {modes.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </span>
      </span>
      <span className={styles.docSide}>
        <span className={styles.next}>
          <span className={styles.nextLabel}>{t('portal.booking.nextAvailable')}</span>
          <span className={styles.nextValue}>{nextText(doctor.nextAvailableAt, today, dateOf, timeZone)}</span>
        </span>
        <Button
          variant="primary"
          size="sm"
          aria-label={t('portal.booking.selectDoctor', { doctor: doctor.displayName })}
          onClick={onSelect}
        >
          {t('portal.booking.select')}
        </Button>
      </span>
    </div>
  )
}

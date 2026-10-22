import type { PatientSummary } from '@/domain/clinical'
import { flagLetter, isAbnormal } from '@/domain/labs'
import { formatLabValue, formatTime, t } from '@/i18n'
import { cx } from '@/shared/cx'
import styles from '../Notes.module.css'
import type { InsertKey } from '../model/noteForm'

interface Props {
  readonly summary: PatientSummary
  readonly inserts: readonly InsertKey[]
  readonly pulledAt: Date
  readonly timeZone: string
}

function Grid({ summary, inserts }: Pick<Props, 'summary' | 'inserts'>) {
  const labs = inserts.includes('labs') ? summary.latestResults : []
  const vitals = inserts.includes('vitals') ? summary.vitals : []
  if (labs.length + vitals.length === 0) return null
  return (
    <ul className={styles.inv}>
      {labs.map((r) => (
        <li key={r.name} className={styles.invItem}>
          <span className={styles.invName}>{r.name}</span>
          <span className={cx(styles.invValue, isAbnormal(r.flag) && styles.abnormal)}>
            {formatLabValue(r.value)} {flagLetter(r.flag)}
            {isAbnormal(r.flag) ? <span className="visually-hidden"> {t(`clinical.flags.${r.flag}`)}</span> : null}
          </span>
        </li>
      ))}
      {vitals.map((v) => (
        <li key={v.key} className={styles.invItem}>
          <span className={styles.invName}>{t(`clinical.summary.vital.${v.key}`)}</span>
          <span className={styles.invValue}>
            {v.display} {v.unit}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TextBlocks({ summary, inserts }: Pick<Props, 'summary' | 'inserts'>) {
  const lines = [
    ...(inserts.includes('medications') ? summary.medications.map((m) => `${m.name}, ${m.detail}`) : []),
    ...(inserts.includes('problems') ? summary.problems.map((p) => p.name) : []),
    ...(inserts.includes('allergies')
      ? summary.banner.allergies.map((a) => t('clinical.banner.allergy', { allergy: a.substance }))
      : []),
  ]
  if (lines.length === 0) return null
  return (
    <ul className={styles.textList}>
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  )
}

/** Read-only facts pulled from the chart, chosen under "Insert from chart". */
export function Investigations({ summary, inserts, pulledAt, timeZone }: Props) {
  return (
    <div className={styles.sec}>
      <span className={styles.secHead}>
        <span className={styles.secLabel}>{t('clinical.note.investigations')}</span>
        <span className={styles.muted}>{t('clinical.note.pulled', { time: formatTime(pulledAt, timeZone) })}</span>
      </span>
      {inserts.length === 0 ? <span className={styles.muted}>{t('clinical.note.nothingPulled')}</span> : null}
      <Grid summary={summary} inserts={inserts} />
      <TextBlocks summary={summary} inserts={inserts} />
    </div>
  )
}

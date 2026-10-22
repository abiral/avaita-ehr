import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { PatientSummary, ProblemStatus } from '@/domain/clinical'
import { flagLetter, isAbnormal } from '@/domain/labs'
import { formatLabValue, formatShortDate, formatTime, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Card, Tag, type TagTone } from '@/ui'
import styles from '../Chart.module.css'

interface CardProps {
  readonly summary: PatientSummary
  readonly timeZone: string
}

const PROBLEM_TONE: Readonly<Record<ProblemStatus, TagTone>> = {
  active: 'info',
  new: 'alert',
  chronic: 'neutral',
  resolved: 'outline',
}

function Head({
  id,
  title,
  link,
}: {
  readonly id: string
  readonly title: string
  readonly link?: { readonly to: string; readonly label: string }
}) {
  return (
    <div className={styles.hd}>
      <h2 id={id} className={styles.hdTitle}>
        {title}
      </h2>
      {link ? (
        <Link to={link.to} className={styles.muted}>
          {link.label}
        </Link>
      ) : null}
    </div>
  )
}

export function Problems({ summary }: CardProps) {
  return (
    <Card as="section" labelledBy="problems" className={styles.clip}>
      <Head id="problems" title={t('clinical.summary.problems')} />
      <ul className={styles.list}>
        {summary.problems.map((p) => (
          <li key={p.name} className={styles.li}>
            <span className={styles.stack}>
              <span className={styles.strong}>{p.name}</span>
              {p.detail ? <span className={styles.muted}>{p.detail}</span> : null}
            </span>
            <Tag tone={PROBLEM_TONE[p.status]}>{t(`clinical.summary.problemStatus.${p.status}`)}</Tag>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function RecentNotes({ summary, timeZone }: CardProps) {
  const id = summary.banner.id
  return (
    <Card as="section" labelledBy="recent-notes" className={styles.clip}>
      <Head
        id="recent-notes"
        title={t('clinical.summary.notes')}
        link={{ to: paths.staff.notes(id), label: t('clinical.summary.allNotes') }}
      />
      {summary.notes.length === 0 ? <p className={styles.empty}>{t('clinical.summary.noNotes')}</p> : null}
      <ul className={styles.list}>
        {summary.notes.map((n) => (
          <li key={n.id}>
            <Link to={`${paths.staff.notes(id)}?note=${n.id}`} className={styles.li}>
              <span className={styles.stack}>
                <span className={styles.strong}>{n.title}</span>
                <span className={styles.muted}>
                  {t('clinical.summary.noteMeta', {
                    author: n.authorName,
                    when: `${formatShortDate(n.at, timeZone)} ${formatTime(n.at, timeZone)}`,
                  })}
                </span>
              </span>
              <Tag>{t(`clinical.summary.noteStatus.${n.status}`)}</Tag>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function Medications({ summary }: CardProps) {
  return (
    <Card as="section" labelledBy="active-meds" className={styles.clip}>
      <Head
        id="active-meds"
        title={t('clinical.summary.medications')}
        link={{ to: paths.staff.chartMedications(summary.banner.id), label: t('clinical.summary.order') }}
      />
      {summary.medications.length === 0 ? <p className={styles.empty}>{t('clinical.summary.noMedications')}</p> : null}
      <ul className={styles.list}>
        {summary.medications.map((m) => (
          <li key={m.name} className={cx(styles.li, styles.med)}>
            <span className={styles.strong}>{m.name}</span>
            <span className={styles.muted}>{m.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function LatestResults({ summary }: CardProps) {
  return (
    <Card as="section" labelledBy="latest-results" className={styles.clip}>
      <Head
        id="latest-results"
        title={t('clinical.summary.results')}
        link={{ to: paths.staff.chartResults(summary.banner.id), label: t('clinical.summary.allResults') }}
      />
      {summary.latestResults.length === 0 ? <p className={styles.empty}>{t('clinical.summary.noResults')}</p> : null}
      <ul className={styles.list}>
        {summary.latestResults.map((r) => (
          <li key={r.name} className={styles.li}>
            <span>{r.name}</span>
            <span className={styles.labValue}>
              <span className={cx(styles.mono, isAbnormal(r.flag) && styles.abnormal)}>{formatLabValue(r.value)}</span>
              <span className={styles.labUnit}>{r.unit}</span>
              <span className={styles.flag}>
                {flagLetter(r.flag)}
                {isAbnormal(r.flag) ? <span className="visually-hidden"> {t(`clinical.flags.${r.flag}`)}</span> : null}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CareTeam({ summary }: CardProps) {
  return (
    <Card as="section" labelledBy="care-team" className={styles.team}>
      <h2 id="care-team" className={styles.hdTitle}>
        {t('clinical.summary.careTeam')}
      </h2>
      {summary.careTeam.map((m) => (
        <span key={m.name} className={styles.teamRow}>
          <span>{m.name}</span>
          <span className={styles.muted}>{m.role}</span>
        </span>
      ))}
    </Card>
  )
}

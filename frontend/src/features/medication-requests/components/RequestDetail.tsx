import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { ageOn, localDateOf } from '@/domain/time'
import { isOpenRefill, type FiredCheck, type RefillRequest } from '@/domain/medications'
import { formatDate, formatShortDate, formatTime, t } from '@/i18n'
import { Card, StatusMessage, Tag } from '@/ui'
import styles from '../Requests.module.css'
import type { DecisionForm } from '../model/decisionForm'
import { requestState } from '../model/requestState'
import { DecisionPanel } from './DecisionPanel'
import { STATE_TONE } from './RequestNav'

export interface RequestDetailProps {
  readonly request: RefillRequest
  readonly fired: readonly FiredCheck[]
  readonly now: Date
  readonly timeZone: string
  readonly busy: boolean
  readonly error: string | null
  readonly tried: boolean
  readonly onSubmit: (form: DecisionForm) => void
}

function Facts({ r, now, timeZone }: { readonly r: RefillRequest; readonly now: Date; readonly timeZone: string }) {
  const age = ageOn(r.patientBirthDate, localDateOf(now, timeZone))
  const last = r.lastDispensed
  return (
    <dl className={styles.facts}>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.patient')}</dt>
        <dd>
          <Link className={styles.strong} to={paths.staff.chart(r.patientId)}>
            {r.patientName}
          </Link>{' '}
          {t('clinical.refills.demographics', { age, sex: t(`clinical.refills.sex.${r.patientSex}`), mrn: r.mrn })}
        </dd>
      </div>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.indication')}</dt>
        <dd>{r.indication}</dd>
      </div>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.lastDispensed')}</dt>
        <dd>
          {last
            ? t('clinical.refills.lastDispensedValue', { date: formatDate(last.at, timeZone), quantity: last.quantity })
            : t('clinical.refills.never')}
        </dd>
      </div>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.requested')}</dt>
        <dd>
          {t('clinical.refills.requestedValue', {
            days: r.quantityDays,
            pickup: t(`clinical.refills.pickup.${r.pickup}`),
          })}
        </dd>
      </div>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.note')}</dt>
        <dd className={styles.note}>{r.note || t('clinical.refills.noNote')}</dd>
      </div>
      <div className={styles.kv}>
        <dt>{t('clinical.refills.allergies')}</dt>
        <dd className={r.allergies.length > 0 ? styles.allergy : undefined}>
          {r.allergies.length > 0 ? r.allergies.join(', ') : t('clinical.refills.noAllergies')}
        </dd>
      </div>
    </dl>
  )
}

/** Every check that fired is listed above the decision, with a link to the labs behind it. */
function SafetyChecks({ r, fired }: { readonly r: RefillRequest; readonly fired: readonly FiredCheck[] }) {
  if (fired.length === 0) return null
  return (
    <ul className={styles.checks} aria-label={t('clinical.refills.safetyChecks')}>
      {fired.map((f) => (
        <li key={f.id} className={styles.check}>
          <strong>{t(`clinical.refills.checkName.${f.id}`)}</strong>
          <span>{t(`clinical.refills.checks.${f.id}`, f.facts)}</span>
          {f.labAt ? (
            <Link className={styles.checkLink} to={paths.staff.chartResults(r.patientId)}>
              {t('clinical.refills.viewLab')}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function Done({ r, timeZone }: { readonly r: RefillRequest; readonly timeZone: string }) {
  const state = requestState(r.status)
  const params = {
    state: t(`clinical.refills.state.${state}`),
    name: r.decidedBy ?? '',
    time: r.decidedAt ? formatTime(r.decidedAt, timeZone) : '',
  }
  return (
    <StatusMessage>
      {state === 'declined' ? t('clinical.refills.declinedText', params) : t('clinical.refills.doneText', params)}
    </StatusMessage>
  )
}

/** C9 detail: who and what, the safety checks, then the decision or its outcome. */
export function RequestDetail(p: RequestDetailProps) {
  const { request: r, timeZone } = p
  const state = requestState(r.status)
  return (
    <Card as="article" className={styles.detail} labelledBy="request-title">
      <div className={styles.detailHead}>
        <div className={styles.titleBlock}>
          <span className={styles.muted}>
            {formatShortDate(r.requestedAt, timeZone)}, {formatTime(r.requestedAt, timeZone)}
          </span>
          <h2 id="request-title" className={styles.medName}>
            {r.medicationName}
          </h2>
          <span className={styles.sig}>{r.instructions}</span>
        </div>
        <Tag tone={STATE_TONE[state]}>{t(`clinical.refills.state.${state}`)}</Tag>
      </div>
      <Facts r={r} now={p.now} timeZone={timeZone} />
      <SafetyChecks r={r} fired={p.fired} />
      {isOpenRefill(r.status) ? (
        <DecisionPanel key={r.id} request={r} busy={p.busy} error={p.error} tried={p.tried} onSubmit={p.onSubmit} />
      ) : (
        <Done r={r} timeZone={timeZone} />
      )}
    </Card>
  )
}

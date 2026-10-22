import { useState } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { isCritical, labResultReview, resultFlag, type LabResult } from '@/domain/labs'
import { t } from '@/i18n'
import { Banner, Button, ButtonLink, Card, Checkbox, StatusMessage, Tag, TrendChart } from '@/ui'
import styles from '../Results.module.css'
import { focusAnalyte, trendOf } from '../model/trend'
import type { useResultsReview } from '../model/useResultsReview'
import { ResultTable } from './ResultTable'

type Review = ReturnType<typeof useResultsReview>

function Status({ result }: { readonly result: LabResult }) {
  if (result.review === 'acknowledged') return <Tag tone="info">{t('clinical.results.status.reviewed')}</Tag>
  return isCritical(resultFlag(result)) ? (
    <Tag tone="critical">{t('clinical.results.status.critical')}</Tag>
  ) : (
    <Tag>{t('clinical.results.status.unreviewed')}</Tag>
  )
}

function Head({ result }: { readonly result: LabResult }) {
  return (
    <div className={styles.detailHead}>
      <div className={styles.titleBlock}>
        <span className={styles.titleRow}>
          <h2 className={styles.panel}>{result.panel}</h2>
          <Status result={result} />
        </span>
        <span className={styles.meta}>
          <Link to={paths.staff.chart(result.patientId)}>{result.patientName}</Link>
          <span className={styles.mono}>{result.mrn}</span>
          <span className={styles.mono}>{result.accession}</span>
        </span>
      </div>
      <ButtonLink to={paths.staff.newOrder(result.patientId)}>{t('clinical.results.orderFollowUp')}</ButtonLink>
    </div>
  )
}

function Notice({ result }: { readonly result: LabResult }) {
  if (result.releasedToPatient) return <StatusMessage>{t('clinical.results.releasedText')}</StatusMessage>
  if (result.review === 'acknowledged')
    return <StatusMessage>{t('clinical.results.notReleased', { name: result.acknowledgedBy ?? '' })}</StatusMessage>
  return null
}

function Actions({
  r,
  result,
  release,
  comment,
}: {
  readonly r: Review
  readonly result: LabResult
  readonly release: boolean
  readonly comment: string
}) {
  if (result.review !== 'acknowledged')
    return (
      <Button variant="primary" disabled={r.busy} onClick={() => r.acknowledge.mutate({ result, release, comment })}>
        {r.busy ? t('clinical.results.working') : t('clinical.results.acknowledge')}
      </Button>
    )
  if (labResultReview(result, 'release').ok)
    return (
      <Button variant="primary" disabled={r.busy} onClick={() => r.release.mutate({ result, comment })}>
        {r.busy ? t('clinical.results.working') : t('clinical.results.releaseNow')}
      </Button>
    )
  return (
    <Button variant="primary" disabled>
      {t('clinical.results.acknowledged')}
    </Button>
  )
}

/** C8 detail: trend for the key analyte, all values, comment for the portal, acknowledge and release. */
export function ResultDetail({
  r,
  result,
  timeZone,
}: {
  readonly r: Review
  readonly result: LabResult
  readonly timeZone: string
}) {
  const [comment, setComment] = useState(result.patientComment)
  const [release, setRelease] = useState(true)
  const focus = focusAnalyte(result.analytes)
  const critical = isCritical(resultFlag(result))
  return (
    <Card as="article" className={styles.detail}>
      <Head result={result} />
      <div className={styles.notice}>
        <Notice result={result} />
        {r.error ? <Banner tone="critical">{r.error}</Banner> : null}
      </div>
      {focus && focus.history.length > 0 ? (
        <div className={styles.chart}>
          <TrendChart {...trendOf(focus, result.reportedAt, timeZone)} />
        </div>
      ) : null}
      <ResultTable result={result} timeZone={timeZone} />
      {result.releasedToPatient ? null : (
        <div className={styles.release}>
          <label htmlFor="patient-comment" className={styles.label}>
            {t('clinical.results.comment')}
          </label>
          <textarea
            id="patient-comment"
            className={styles.textarea}
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {result.review === 'acknowledged' ? null : (
            <Checkbox
              label={t('clinical.results.release')}
              checked={release}
              onChange={(e) => setRelease(e.target.checked)}
            />
          )}
          {critical && result.review !== 'acknowledged' ? (
            <span className={styles.meta}>{t('clinical.results.criticalFirst')}</span>
          ) : null}
        </div>
      )}
      <div className={styles.foot}>
        <Actions r={r} result={result} release={release} comment={comment} />
      </div>
    </Card>
  )
}

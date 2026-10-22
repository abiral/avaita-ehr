import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { t } from '@/i18n'
import { Card, Page, SkeletonRows } from '@/ui'
import { InboxNav } from './components/InboxNav'
import { ResultDetail } from './components/ResultDetail'
import { useResultsReview, type ReviewMode } from './model/useResultsReview'
import styles from './Results.module.css'

/** Puts the auto-opened result in the address so re-sorting the inbox after a review does not switch away. */
function usePinOpenResult(openId: string | null, linkTo: (id: string) => string) {
  const { resultId } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    if (!resultId && openId) void navigate(linkTo(openId), { replace: true })
  }, [resultId, openId, linkTo, navigate])
}

function Review({
  mode,
  linkTo,
  title,
}: {
  readonly mode: ReviewMode
  readonly linkTo: (id: string) => string
  readonly title: string
}) {
  const r = useResultsReview(mode)
  const { timeZone } = useTenant()
  usePinOpenResult(r.openId, linkTo)
  const result = r.result.data
  return (
    <Page area="staff" gap={20}>
      {mode.kind === 'inbox' ? <h1 className={styles.title}>{title}</h1> : <h2 className={styles.title}>{title}</h2>}
      <div className={styles.layout}>
        <InboxNav items={r.inbox.data} openId={r.openId} linkTo={linkTo} timeZone={timeZone} />
        {result ? (
          <ResultDetail
            key={`${result.id}-${result.review}-${String(result.releasedToPatient)}`}
            r={r}
            result={result}
            timeZone={timeZone}
          />
        ) : (
          <Card className={styles.detail}>
            {r.openId ? (
              <SkeletonRows label={t('clinical.results.loading')} rows={6} />
            ) : (
              <p className={styles.empty}>{t('clinical.results.choose')}</p>
            )}
          </Card>
        )}
      </div>
    </Page>
  )
}

/** C8 at /staff/results: the ward inbox. */
export function ResultsInboxScreen() {
  return <Review mode={{ kind: 'inbox' }} linkTo={paths.staff.result} title={t('clinical.results.title')} />
}

/** C8 inside the chart: this patient's results. */
export function ChartResultsScreen() {
  const { patientId } = useChartPatient()
  return (
    <Review
      mode={{ kind: 'chart', patientId }}
      linkTo={(id) => paths.staff.chartResult(patientId, id)}
      title={t('clinical.results.chartTitle')}
    />
  )
}

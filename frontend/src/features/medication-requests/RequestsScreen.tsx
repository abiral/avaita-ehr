import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { t } from '@/i18n'
import { Banner, Button, Card, EmptyState, Page, PageHeader, SkeletonRows } from '@/ui'
import { RequestDetail } from './components/RequestDetail'
import { RequestNav } from './components/RequestNav'
import { useRefillQueue } from './model/useRefillQueue'
import styles from './Requests.module.css'

type Queue = ReturnType<typeof useRefillQueue>

function Body({ q }: { readonly q: Queue }) {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  if (q.queue.isError)
    return (
      <Banner
        tone="critical"
        action={
          <Button size="sm" onClick={() => void q.queue.refetch()}>
            {t('clinical.refills.retry')}
          </Button>
        }
      >
        {t('clinical.refills.loadFailed')}
      </Banner>
    )
  if (q.queue.isPending)
    return (
      <Card>
        <SkeletonRows label={t('clinical.refills.loading')} rows={4} />
      </Card>
    )
  if (!q.open)
    return (
      <Card>
        <EmptyState title={t('clinical.refills.empty')} />
      </Card>
    )
  return (
    <div className={styles.layout}>
      <RequestNav requests={q.all} openId={q.open.id} timeZone={timeZone} onSelect={q.select} />
      <RequestDetail
        request={q.open}
        fired={q.fired}
        now={clock.now()}
        timeZone={timeZone}
        busy={q.busy}
        error={q.error}
        tried={q.tried}
        onSubmit={(form) => void q.submit(form)}
      />
    </div>
  )
}

/** C9: refill requests from the portal with safety checks and a double-confirmed approval. */
export function RequestsScreen() {
  const q = useRefillQueue()
  return (
    <Page area="staff" gap={20}>
      <PageHeader eyebrow={t('clinical.refills.eyebrow')} title={t('clinical.refills.title')} />
      <Body q={q} />
    </Page>
  )
}

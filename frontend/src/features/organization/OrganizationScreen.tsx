import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import { useKeys } from '@/app/useKeys'
import { t } from '@/i18n'
import { Banner, Button, Card, Page, PageHeader, SkeletonRows } from '@/ui'
import { Facilities, OnboardingCard, Roles, SharedSettings } from './components/OrgCards'
import styles from './Organization.module.css'

/** A4: facilities, a new hospital's onboarding, shared versus local settings, and roles per facility. */
export function OrganizationScreen() {
  const { repos } = useServices()
  const keys = useKeys()
  const { timeZone } = useTenant()
  const org = useQuery({
    queryKey: keys.organizationOverview,
    queryFn: ({ signal }) => repos.tenancy.organization(signal),
  })
  const data = org.data
  return (
    <Page area="staff" gap={20}>
      <PageHeader title={t('admin.organization.title')} />
      {org.isError ? (
        <Banner
          tone="critical"
          action={
            <Button size="sm" onClick={() => void org.refetch()}>
              {t('admin.organization.retry')}
            </Button>
          }
        >
          {t('admin.organization.loadFailed')}
        </Banner>
      ) : null}
      {org.isPending ? (
        <Card>
          <SkeletonRows label={t('admin.organization.loading')} rows={6} />
        </Card>
      ) : null}
      {data ? (
        <>
          <Facilities facilities={data.facilities} />
          <div className={styles.cols}>
            {data.onboarding ? <OnboardingCard onboarding={data.onboarding} timeZone={timeZone} /> : null}
            <SharedSettings settings={data.settings} />
          </div>
          <Roles overview={data} />
        </>
      ) : null}
    </Page>
  )
}

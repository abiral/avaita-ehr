import { t } from '@/i18n'
import { Banner, Button, Card, EmptyState, Page, PageHeader, SkeletonRows } from '@/ui'
import styles from './AdminPackages.module.css'
import { EditorCard } from './components/EditorCard'
import { PackageTable } from './components/PackageTable'
import { PreviewAside } from './components/PreviewAside'
import { useAdminPackages } from './model/useAdminPackages'

type Screen = ReturnType<typeof useAdminPackages>

function ListState({ s }: { readonly s: Screen }) {
  if (s.list.isError)
    return (
      <Banner
        tone="critical"
        action={
          <Button size="sm" onClick={() => void s.list.refetch()}>
            {t('admin.packages.retry')}
          </Button>
        }
      >
        {t('admin.packages.loadFailed')}
      </Banner>
    )
  if (s.list.isPending)
    return (
      <Card>
        <SkeletonRows label={t('admin.packages.loading')} rows={5} />
      </Card>
    )
  if (s.list.data.length === 0)
    return (
      <Card>
        <EmptyState title={t('admin.packages.none')} body={t('admin.packages.noneBody')} />
      </Card>
    )
  return <PackageTable packages={s.list.data} selected={s.form?.id ?? null} onSelect={s.select} />
}

/** A3: consultation packages with an editor and a live patient preview. */
export function AdminPackagesScreen() {
  const s = useAdminPackages()
  return (
    <Page area="staff" width={1200} gap={20}>
      <PageHeader
        eyebrow={t('admin.packages.eyebrow')}
        title={t('admin.packages.title')}
        sub={t('admin.packages.sub')}
        actions={
          <Button variant="primary" onClick={s.startNew}>
            {t('admin.packages.newPackage')}
          </Button>
        }
      />
      <ListState s={s} />
      {s.form ? (
        <div className={styles.layout}>
          <EditorCard
            form={s.form}
            doctors={s.doctors}
            problems={s.problems}
            notice={s.notice}
            saving={s.saving}
            onEdit={s.edit}
            onSubmit={s.submit}
          />
          <PreviewAside form={s.form} doctors={s.doctors} />
        </div>
      ) : null}
    </Page>
  )
}

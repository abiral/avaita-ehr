import { t } from '@/i18n'
import { EmptyState, Page, PageHeader } from '@/ui'

export function Placeholder({ title, area }: { readonly title: string; readonly area: 'portal' | 'staff' }) {
  return (
    <Page area={area}>
      <PageHeader title={title} />
      <EmptyState title={title} body={t('common.placeholder.body')} />
    </Page>
  )
}

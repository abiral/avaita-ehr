import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { buttonClass } from '@/ui'
import { PackageCard } from '@/features/patient-packages'
import styles from '../AdminPackages.module.css'
import { previewView, type PackageForm } from '../model/packageForm'

/** Live preview: the P6 PackageCard rendered from the unsaved form. */
export function PreviewAside({
  form,
  doctors,
}: {
  readonly form: PackageForm
  readonly doctors: readonly Practitioner[]
}) {
  const view = previewView(form, doctors)
  return (
    <aside className={styles.preview} aria-labelledby="pkg-preview">
      <span id="pkg-preview" className="cap">
        {t('admin.packages.preview')}
      </span>
      <PackageCard
        view={view}
        showDescription
        headingLevel={3}
        action={
          <span className={cx(buttonClass('primary', 'sm'), styles.fakeButton)} aria-hidden="true">
            {t('portal.packages.view')}
          </span>
        }
      />
      <span className={styles.previewFoot}>
        {view.doctor} · <Link to={paths.admin.availability}>{t('admin.packages.checkAvailability')}</Link>
      </span>
    </aside>
  )
}

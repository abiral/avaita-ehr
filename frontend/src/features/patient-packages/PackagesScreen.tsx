import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { LinkTabs, Page } from '@/ui'
import { BookAside } from './components/BookAside'
import { BrowseView } from './components/BrowseView'
import { PackageDetail } from './components/PackageDetail'
import { usePackageBooking } from './model/usePackageBooking'
import { usePackageList } from './model/usePackageList'
import styles from './Packages.module.css'

/** P6: browse, search and filter consultation packages, then book one with its first visit. */
export function PackagesScreen() {
  const list = usePackageList()
  const booking = usePackageBooking(list.all)
  const { pkg } = booking
  return (
    <Page area="portal" gap={20}>
      <div className={styles.head}>
        <Link className={styles.crumb} to={paths.portal.appointments}>
          {t('portal.booking.back')}
        </Link>
        <h1 className={styles.title}>{t('portal.booking.title')}</h1>
      </div>
      <LinkTabs
        label={t('portal.booking.bookBy')}
        compact={false}
        items={[
          { to: paths.portal.book, label: t('portal.booking.doctorsTab'), end: true },
          { to: paths.portal.packages, label: t('portal.booking.packagesTab') },
        ]}
      />
      {pkg ? (
        <div className={styles.layout}>
          <PackageDetail pkg={pkg} onBack={() => booking.dispatch({ type: 'close' })} />
          <BookAside b={booking} pkg={pkg} />
        </div>
      ) : (
        <BrowseView list={list} onOpen={(p) => booking.dispatch({ type: 'open', pkg: p })} />
      )}
    </Page>
  )
}

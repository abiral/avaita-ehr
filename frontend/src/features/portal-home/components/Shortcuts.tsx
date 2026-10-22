import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { Icon, type IconName } from '@/ui'
import styles from '../Home.module.css'

const reportsSub = (count: number): string => {
  if (count === 0) return t('portal.home.reports.sub')
  return count === 1 ? t('portal.home.reports.subNewOne') : t('portal.home.reports.subNew', { count })
}

/** Five shortcuts from the design: book, refill, reports, appointments, packages. */
export function Shortcuts({ newReports }: { readonly newReports: number }) {
  const items: readonly { to: string; icon: IconName; title: string; sub: string }[] = [
    { to: paths.portal.book, icon: 'calendarPlus', title: t('portal.home.book.title'), sub: t('portal.home.book.sub') },
    {
      to: paths.portal.medicines,
      icon: 'pill',
      title: t('portal.home.refill.title'),
      sub: t('portal.home.refill.sub'),
    },
    { to: paths.portal.reports, icon: 'flask', title: t('portal.home.reports.title'), sub: reportsSub(newReports) },
    {
      to: paths.portal.appointments,
      icon: 'list',
      title: t('portal.home.appointments.title'),
      sub: t('portal.home.appointments.sub'),
    },
    {
      to: paths.portal.packages,
      icon: 'package',
      title: t('portal.home.packages.title'),
      sub: t('portal.home.packages.sub'),
    },
  ]
  return (
    <nav aria-label={t('portal.home.actions')}>
      <ul className={styles.actions}>
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className={styles.act}>
              <span className={styles.ico}>
                <Icon name={i.icon} size={18} />
              </span>
              <span className={styles.actTitle}>{i.title}</span> <span className={styles.actSub}>{i.sub}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

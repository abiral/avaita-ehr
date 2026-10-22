import { Link } from 'react-router'
import { t } from '@/i18n'
import { Icon } from '@/ui'
import { paths } from '../routes'
import styles from './Shell.module.css'

export function FacilitySwitcher({ name, meta }: { readonly name: string; readonly meta: string }) {
  return (
    <Link to={paths.staff.workspace} className={styles.switcher} aria-label={t('shell.staff.switchFacility', { name })}>
      <span className={styles.switcherText}>
        <span className={styles.switcherName}>{name}</span>
        <span className={styles.switcherMeta}>{meta}</span>
      </span>
      <Icon name="chevronsUpDown" size={14} strokeWidth={1.8} />
    </Link>
  )
}

import { t } from '@/i18n'
import styles from './Shell.module.css'

export function SkipLink() {
  return (
    <a className={styles.skip} href="#main">
      {t('common.skipToContent')}
    </a>
  )
}

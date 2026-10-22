import { initials } from '@/domain/identity'
import { t } from '@/i18n'
import { Avatar, TextAction } from '@/ui'
import styles from './Shell.module.css'

export function UserBlock({
  name,
  role,
  onSignOut,
}: {
  readonly name: string
  readonly role: string
  readonly onSignOut: () => void
}) {
  return (
    <span className={styles.user}>
      <Avatar initials={initials(name)} />
      <span className={styles.who}>
        <span className={styles.whoName}>{name}</span>
        <span className={styles.whoMeta}>{role}</span>
      </span>
      <TextAction onClick={onSignOut}>{t('common.signOut')}</TextAction>
    </span>
  )
}

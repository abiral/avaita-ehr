import type { VerifiedRegistration } from '@/application/ports'
import { paths } from '@/app/routes'
import { t } from '@/i18n'
import { AuthHeading, authIconClass, authSectionClass, ButtonLink, Icon } from '@/ui'
import { cx } from '@/shared/cx'
import styles from '../Registration.module.css'

/** P2 step 3: the account is ready; existing records are linked by hospital number. */
export function DoneStep({ verified }: { readonly verified: VerifiedRegistration }) {
  const facility = verified.facilityName
  const linked = facility !== null
  return (
    <div className={cx(authSectionClass, styles.done)}>
      <span className={authIconClass}>
        <Icon name="check" size={22} strokeWidth={2} />
      </span>
      <AuthHeading
        title={t('auth.register.doneTitle')}
        sub={
          linked ? t('auth.register.doneLinked', { facility: verified.facilityName ?? '' }) : t('auth.register.doneNew')
        }
      />
      <dl className={styles.summary}>
        <dt>{t('auth.register.patientId')}</dt>
        <dd className="mono">{verified.mrn}</dd>
        {linked ? (
          <>
            <dt>{t('auth.register.linkedRecords')}</dt>
            <dd>
              {t('auth.register.linkedSummary', {
                visits: verified.linked.visits,
                labs: verified.linked.labReports,
                medicines: verified.linked.medicines,
              })}
            </dd>
          </>
        ) : null}
      </dl>
      <span className={styles.stretch}>
        <ButtonLink to={paths.portal.home} variant="primary" size="lg" block>
          {t('auth.register.goHome')}
        </ButtonLink>
      </span>
    </div>
  )
}

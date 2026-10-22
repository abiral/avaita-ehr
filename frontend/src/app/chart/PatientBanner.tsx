import { NavLink } from 'react-router'
import type { PatientBanner as Banner } from '@/domain/clinical'
import { initials } from '@/domain/identity'
import { ageOn, daysBetween, localDateOf } from '@/domain/time'
import { formatShortDate, t } from '@/i18n'
import { cx } from '@/shared/cx'
import { ButtonLink, Tag } from '@/ui'
import { paths } from '../routes'
import styles from './Chart.module.css'

const TABS = [
  { key: 'summary', to: paths.staff.chart, end: true },
  { key: 'notes', to: paths.staff.notes, end: false },
  { key: 'orders', to: paths.staff.orders, end: false },
  { key: 'results', to: paths.staff.chartResults, end: false },
  { key: 'medications', to: paths.staff.chartMedications, end: false },
] as const

function Facts({ banner, now, timeZone }: { readonly banner: Banner; readonly now: Date; readonly timeZone: string }) {
  const today = localDateOf(now, timeZone)
  const admitted = banner.admittedAt
  return (
    <span className={styles.facts}>
      <span>
        {t('clinical.banner.ageSex', {
          age: ageOn(banner.birthDate, today),
          sex: t(`clinical.banner.sex.${banner.sex}`),
        })}
      </span>
      <span className={styles.mono}>{banner.mrn}</span>
      <span>{banner.bed ? t('clinical.banner.bed', { bed: banner.bed }) : t('clinical.banner.outpatient')}</span>
      {admitted ? (
        <span>
          {t('clinical.banner.admitted', {
            date: formatShortDate(admitted, timeZone),
            day: daysBetween(localDateOf(admitted, timeZone), today) + 1,
          })}
        </span>
      ) : null}
      {banner.attendingName ? <span>{t('clinical.banner.attending', { name: banner.attendingName })}</span> : null}
    </span>
  )
}

export interface PatientBannerProps {
  readonly banner: Banner
  readonly now: Date
  readonly timeZone: string
}

/** Two identifiers (name and MRN), allergies and code status above every chart screen (C5 to C8). */
export function PatientBanner({ banner, now, timeZone }: PatientBannerProps) {
  return (
    <section className={styles.band} aria-label={t('clinical.banner.region')}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(banner.displayName)}
            </span>
            <div className={styles.lines}>
              <span className={styles.nameRow}>
                <h1 className={styles.name}>{banner.displayName}</h1>
                {banner.allergies.length > 0 ? (
                  banner.allergies.map((a) => (
                    <Tag key={a.substance} tone="alert">
                      {t('clinical.banner.allergy', {
                        allergy: a.reaction ? `${a.substance} (${a.reaction})` : a.substance,
                      })}
                    </Tag>
                  ))
                ) : (
                  <Tag>{t('clinical.banner.noAllergies')}</Tag>
                )}
                <Tag>{banner.codeStatus}</Tag>
              </span>
              <Facts banner={banner} now={now} timeZone={timeZone} />
            </div>
          </div>
          <div className={styles.actions}>
            <ButtonLink to={paths.staff.newOrder(banner.id)}>{t('clinical.banner.orderLabs')}</ButtonLink>
            <ButtonLink to={paths.staff.newNote(banner.id)} variant="primary">
              {t('clinical.banner.newNote')}
            </ButtonLink>
          </div>
        </div>
        <nav className={styles.tabs} aria-label={t('clinical.banner.tabs')}>
          {TABS.map((tab) => (
            <NavLink key={tab.key} to={tab.to(banner.id)} end={tab.end} className={cx(styles.tab)}>
              {t(`clinical.banner.tab.${tab.key}`)}
            </NavLink>
          ))}
        </nav>
      </div>
    </section>
  )
}

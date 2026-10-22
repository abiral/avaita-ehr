import { Link } from 'react-router'
import { paths } from '@/app/routes'
import { useTenant } from '@/app/TenantProvider'
import { packageFormats, type ConsultationPackage, type PackageFormat } from '@/domain/packages'
import { formatShortDay, formatTime, t } from '@/i18n'
import { buttonClass, Banner, Button, Card, Icon } from '@/ui'
import styles from '../Packages.module.css'
import { priceLabel } from '../model/cardView'
import type { usePackageBooking } from '../model/usePackageBooking'

type Booking = ReturnType<typeof usePackageBooking>

export const whenLabel = (d: Date, timeZone: string): string =>
  t('portal.packages.when', { day: formatShortDay(d, timeZone), time: formatTime(d, timeZone) })

function Formats({
  pkg,
  value,
  onPick,
}: {
  readonly pkg: ConsultationPackage
  readonly value: PackageFormat | null
  readonly onPick: (f: PackageFormat) => void
}) {
  const { facility } = useTenant()
  return (
    <div className={styles.group} role="group" aria-labelledby="pkg-formats">
      <span id="pkg-formats" className={styles.groupLabel}>
        {t('portal.packages.howVisits')}
      </span>
      {packageFormats[pkg.format].choices.map((f) => (
        <button key={f} type="button" className={styles.opt} aria-pressed={value === f} onClick={() => onPick(f)}>
          <span className={styles.optName}>{t(`portal.packages.formats.${f}.name`)}</span>
          <span className={styles.small}>
            {t(`portal.packages.formats.${f}.desc`, { facility: facility?.shortName ?? '' })}
          </span>
        </button>
      ))}
    </div>
  )
}

function FirstVisit({ b }: { readonly b: Booking }) {
  const { timeZone } = useTenant()
  const { slots, loading } = b.firstVisit
  return (
    <div className={styles.group}>
      <span id="pkg-first" className={styles.groupLabel}>
        {t('portal.packages.firstVisit')}
      </span>
      {loading ? <span className={styles.small}>{t('portal.packages.loadingTimes')}</span> : null}
      {!loading && slots.length === 0 ? <span className={styles.small}>{t('portal.packages.noTimes')}</span> : null}
      <div className={styles.slots} role="group" aria-labelledby="pkg-first">
        {slots.map((s) => (
          <button
            key={s.start.toISOString()}
            type="button"
            className={styles.slot}
            aria-pressed={b.state.start?.getTime() === s.start.getTime()}
            onClick={() => b.dispatch({ type: 'pick-slot', start: s.start })}
          >
            {whenLabel(s.start, timeZone)}
          </button>
        ))}
      </div>
      <span className={styles.small}>{t('portal.packages.remainingLater')}</span>
    </div>
  )
}

function Booked({ b, pkg }: { readonly b: Booking; readonly pkg: ConsultationPackage }) {
  const { timeZone } = useTenant()
  const format = b.state.format ?? pkg.format
  const when = b.state.start ? whenLabel(b.state.start, timeZone) : ''
  return (
    <div className={styles.done} role="status">
      <span className={styles.doneIcon}>
        <Icon name="check" size={22} strokeWidth={2} />
      </span>
      <h3 className={styles.doneTitle}>{t('portal.packages.bookedTitle')}</h3>
      <p className={styles.muted}>
        {t('portal.packages.bookedBody', {
          name: pkg.name,
          doctor: pkg.practitionerName,
          when,
          format: t(`portal.packages.formats.${format}.name`).toLowerCase(),
        })}
      </p>
      <span className={styles.small}>
        {t('portal.packages.reference')} <span className={styles.mono}>{b.state.enrollmentId}</span>
      </span>
      <Link className={buttonClass('primary')} to={paths.portal.appointments}>
        {t('portal.packages.goToAppointments')}
      </Link>
    </div>
  )
}

/** P6 aside: price, format choice (strategy table), first visit and Book package. */
export function BookAside({ b, pkg }: { readonly b: Booking; readonly pkg: ConsultationPackage }) {
  const busy = b.state.step === 'submitting'
  return (
    <Card as="aside" className={styles.aside}>
      {b.state.step === 'booked' ? (
        <Booked b={b} pkg={pkg} />
      ) : (
        <>
          <span className={styles.priceBlock}>
            <span className={styles.bigPrice}>{priceLabel(pkg.price)}</span>
            <span className={styles.small}>{t('portal.packages.onePayment')}</span>
          </span>
          <Formats pkg={pkg} value={b.state.format} onPick={(format) => b.dispatch({ type: 'pick-format', format })} />
          <FirstVisit b={b} />
          {b.state.error ? <Banner tone="critical">{b.state.error}</Banner> : null}
          <Button variant="primary" disabled={b.state.step !== 'first-visit'} onClick={b.submit}>
            {busy ? t('portal.packages.booking') : t('portal.packages.book')}
          </Button>
        </>
      )}
    </Card>
  )
}

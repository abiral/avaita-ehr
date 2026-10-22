import { t } from '@/i18n'
import { Page, SkeletonRows } from '@/ui'
import { BookingFlow } from './BookingFlow'
import { useRescheduleTarget } from './model/useRescheduleTarget'

/** P5 entry: a new booking, or a reschedule of an existing appointment (?reschedule=<id>). */
export function BookingScreen() {
  const target = useRescheduleTarget()
  if (!target.ready) {
    return (
      <Page area="portal">
        <SkeletonRows label={t('portal.booking.loading')} rows={3} />
      </Page>
    )
  }
  return <BookingFlow key={target.start.rescheduleId ?? 'new'} start={target.start} />
}

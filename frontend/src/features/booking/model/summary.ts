import { formatShortDay, formatTime, t } from '@/i18n'
import type { SummaryRow } from '../components/Summary'
import type { useBookingFlow } from './useBookingFlow'
import { visitModes } from './visitModes'

type Flow = ReturnType<typeof useBookingFlow>

export const whenText = (start: Date, timeZone: string): string =>
  t('portal.booking.whenText', { day: formatShortDay(start, timeZone), time: formatTime(start, timeZone) })

/** Summary aside rows for the current booking state. */
export function summaryRows(flow: Flow, hospital: string, timeZone: string): SummaryRow[] {
  const { doctor, state } = flow
  const notChosen = t('portal.booking.notChosen')
  const mode = state.mode && doctor ? visitModes[state.mode] : null
  return [
    { label: t('portal.booking.hospital'), value: hospital },
    { label: t('portal.booking.doctor'), value: doctor?.displayName ?? notChosen },
    { label: t('portal.booking.speciality'), value: doctor?.category ?? t('portal.booking.any') },
    { label: t('portal.booking.visit'), value: mode ? mode.name() : notChosen },
    { label: t('portal.booking.when'), value: state.start ? whenText(state.start, timeZone) : notChosen },
    { label: t('portal.booking.fee'), value: mode ? mode.fee() : t('portal.booking.feeLater') },
  ]
}

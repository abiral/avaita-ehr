import type { Appointment } from '@/domain/appointments'
import { formatLongDayShortMonth, formatTime, t } from '@/i18n'

const how = (a: Appointment): string => {
  if (a.kind === 'lab') return a.preparation ? t('portal.appointments.fasting') : ''
  return a.mode === 'remote' ? t('portal.appointments.video') : t('portal.appointments.inPerson')
}

/** "Wednesday 21 Oct, 10:20 · In person" in the facility zone. */
export function whenLine(a: Appointment, tz: string): string {
  const kind = how(a)
  const base = `${formatLongDayShortMonth(a.start, tz)}, ${formatTime(a.start, tz)}`
  return kind ? `${base} · ${kind}` : base
}

/** Short "Wednesday 21 Oct" for messages. */
export const dayLine = (a: Appointment, tz: string): string => formatLongDayShortMonth(a.start, tz)

/** Second line: location for upcoming visits, outcome for past ones. */
export function whereLine(a: Appointment, past: boolean): string {
  if (a.status === 'cancelled')
    return a.cancelledBy === 'patient'
      ? t('portal.appointments.cancelledByYou')
      : t('portal.appointments.cancelledByHospital')
  if (!past)
    return a.kind === 'consultation' && a.reason && a.reason !== 'Follow-up'
      ? `${a.reason} · ${a.location.split(' · ').pop() ?? a.location}`
      : a.location
  if (a.kind === 'lab') return t('portal.appointments.reportReady')
  return `${a.reason} · ${t(`portal.appointments.status.${a.status}`)}`
}

export const STATUS_TONE = {
  booked: 'info',
  arrived: 'info',
  completed: 'neutral',
  cancelled: 'alert',
  no_show: 'warn',
} as const

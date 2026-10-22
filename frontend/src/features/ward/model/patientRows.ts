import type { PatientFlag, PatientListItem } from '@/domain/clinical'
import { ageOn, daysBetween, localDateOf } from '@/domain/time'
import { t } from '@/i18n'
import type { TagTone } from '@/ui'

export const demographics = (p: PatientListItem, now: Date, timeZone: string): string =>
  t('staff.patients.demo', {
    age: ageOn(p.birthDate, localDateOf(now, timeZone)),
    sex: t(`staff.patients.sex.${p.sex}`),
    mrn: p.mrn,
  })

/** Day of admission, counting the admission day as day 1. */
export const admissionDay = (p: PatientListItem, now: Date, timeZone: string): number | null =>
  p.admittedAt ? daysBetween(localDateOf(p.admittedAt, timeZone), localDateOf(now, timeZone)) + 1 : null

export const FLAG_TONE: Readonly<Record<PatientFlag, TagTone>> = {
  penicillin: 'alert',
  isolation: 'outline',
  falls: 'outline',
  dnacpr: 'outline',
  nkda: 'outline',
}

/** Beds sort numerically ("4B-03" before "4B-12"); patients without a bed go last. */
export const byBed = (a: PatientListItem, b: PatientListItem): number =>
  (a.bed ?? '￿').localeCompare(b.bed ?? '￿', undefined, { numeric: true })

export const bedNumber = (bed: string | null): string => (bed ? (bed.split('-').pop() ?? bed) : '')

import type { VisitMode } from '../scheduling/types'
import type { ConsultationPackage, PackageFormat } from './types'

export interface FormatStrategy {
  /** Visit modes allowed for the first visit or for follow-ups. */
  allowedModes(firstVisit: boolean): readonly VisitMode[]
  /** Formats the patient can pick when booking (patient_choice lets them choose). */
  readonly choices: readonly PackageFormat[]
}

/** Strategy table: hybrid (first visit on-site, then remote) is data, not branches. */
export const packageFormats: Readonly<Record<PackageFormat, FormatStrategy>> = {
  onsite: { allowedModes: () => ['onsite'], choices: ['onsite'] },
  remote: { allowedModes: () => ['remote'], choices: ['remote'] },
  hybrid: { allowedModes: (first) => (first ? ['onsite'] : ['remote']), choices: ['hybrid'] },
  patient_choice: { allowedModes: () => ['onsite', 'remote'], choices: ['onsite', 'remote'] },
}

/** The mode used to book the first visit for a chosen format. */
export const firstVisitMode = (chosen: PackageFormat): VisitMode => {
  const [mode = 'onsite'] = packageFormats[chosen].allowedModes(true)
  return mode
}

export const canChooseFormat = (pkg: Pick<ConsultationPackage, 'format'>, chosen: PackageFormat): boolean =>
  packageFormats[pkg.format].choices.includes(chosen)

/** "90 days", "12 months" style validity label parts. */
export const validityParts = (days: number): { readonly unit: 'days' | 'months'; readonly count: number } =>
  days % 365 === 0 ? { unit: 'months', count: (days / 365) * 12 } : { unit: 'days', count: days }

export const VALIDITY_OPTIONS = [14, 30, 45, 60, 90, 365] as const

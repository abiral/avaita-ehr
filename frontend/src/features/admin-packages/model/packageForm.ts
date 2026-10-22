import type { PackageId, PractitionerId } from '@/core/branded'
import { money } from '@/core/money'
import type { ConsultationPackage, PackageDraft, PackageFormat, PackageItem } from '@/domain/packages'
import type { Practitioner } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { toCardView, type PackageCardView } from '@/features/patient-packages'

/** Editor state for A3. Price and cap stay as typed text until saved. */
export interface PackageForm {
  readonly id: PackageId | null
  readonly name: string
  readonly practitionerId: PractitionerId | null
  readonly description: string
  readonly format: PackageFormat
  readonly validityDays: number
  readonly price: string
  readonly cap: string
  readonly published: boolean
  readonly items: readonly PackageItem[]
}

export const CURRENCY = 'NPR'
const DEFAULT_VALIDITY = 60
const DEFAULT_CAP = '20'

export const PRESETS = [
  { key: 'consultation', type: 'consultation' },
  { key: 'video', type: 'consultation' },
  { key: 'kidney', type: 'lab' },
  { key: 'cbc', type: 'lab' },
  { key: 'ecg', type: 'lab' },
  { key: 'dietitian', type: 'session' },
  { key: 'messaging', type: 'messaging' },
  { key: 'report', type: 'report' },
] as const
export type PresetKey = (typeof PRESETS)[number]['key']

export const presetItem = (key: PresetKey): PackageItem => {
  const preset = PRESETS.find((p) => p.key === key) ?? PRESETS[0]
  return {
    type: preset.type,
    quantity: preset.type === 'messaging' ? 30 : 1,
    label: t(`admin.packages.presets.${key}`),
  }
}

export const newPackageForm = (doctor: PractitionerId | null): PackageForm => ({
  id: null,
  name: '',
  practitionerId: doctor,
  description: t('admin.packages.descriptionDefault'),
  format: 'hybrid',
  validityDays: DEFAULT_VALIDITY,
  price: '',
  cap: DEFAULT_CAP,
  published: false,
  items: [presetItem('consultation')],
})

export const formFromPackage = (p: ConsultationPackage): PackageForm => ({
  id: p.id,
  name: p.name,
  practitionerId: p.practitionerId,
  description: p.description,
  format: p.format,
  validityDays: p.validityDays,
  price: p.price ? String(p.price.minor / 100) : '',
  cap: p.monthlyCap === null ? '' : String(p.monthlyCap),
  published: p.published,
  items: p.items,
})

const parsePrice = (text: string) => {
  const value = Number(text.trim())
  return text.trim() && Number.isFinite(value) && value >= 0 ? money(value * 100, CURRENCY) : null
}

/** An empty cap means no monthly limit; anything that is not a whole number is passed on for validation. */
const parseCap = (text: string): number | null => (text.trim() ? Number(text.trim()) : null)

export const toDraft = (f: PackageForm): PackageDraft => ({
  id: f.id,
  practitionerId: f.practitionerId ?? ('' as PractitionerId),
  name: f.name.trim(),
  description: f.description.trim(),
  format: f.format,
  validityDays: f.validityDays,
  price: parsePrice(f.price),
  monthlyCap: parseCap(f.cap),
  published: f.published,
  items: f.items,
})

/** The live preview: the same view model P6 renders, built from the unsaved form. */
export function previewView(f: PackageForm, doctors: readonly Practitioner[]): PackageCardView {
  const doctor = doctors.find((d) => d.id === f.practitionerId)
  return toCardView({
    name: f.name.trim() || t('admin.packages.untitled'),
    practitionerName: doctor?.displayName ?? '',
    category: doctor?.category ?? '',
    format: f.format,
    description: f.description,
    items: f.items,
    validityDays: f.validityDays,
    price: parsePrice(f.price),
  })
}

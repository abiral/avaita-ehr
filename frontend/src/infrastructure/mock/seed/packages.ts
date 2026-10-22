import type { PackageFormat, PackageItemType } from '@/domain/packages/types'

export interface SeedPackage {
  readonly id: string
  readonly practitionerId: string
  readonly name: string
  readonly description: string
  readonly format: PackageFormat
  readonly validityDays: number
  readonly published: boolean
  readonly bookedCount: number
  readonly price: { readonly minor: number; readonly currency: string } | null
  readonly monthlyCap: number | null
  readonly items: readonly { readonly type: PackageItemType; readonly quantity: number; readonly label: string }[]
}

const P = (
  id: string,
  practitionerId: string,
  name: string,
  format: PackageFormat,
  validityDays: number,
  bookedCount: number,
  published: boolean,
  description: string,
  items: SeedPackage['items'],
): SeedPackage => ({
  id,
  practitionerId,
  name,
  description,
  format,
  validityDays,
  published,
  bookedCount,
  price: null,
  monthlyCap: 20,
  items,
})

export const PACKAGES: readonly SeedPackage[] = [
  P(
    'pkg_kidney',
    'pr_karki',
    'Kidney care, 3 months',
    'hybrid',
    90,
    18,
    true,
    'Regular review of kidney function with diet support and a direct line to your care team.',
    [
      { type: 'consultation', quantity: 3, label: '3 consultations: 1 on-site, 2 by video' },
      { type: 'lab', quantity: 2, label: '2 kidney function panels' },
      { type: 'session', quantity: 1, label: '1 session with a renal dietitian' },
      { type: 'messaging', quantity: 90, label: 'Message your care team for 90 days' },
    ],
  ),
  P(
    'pkg_diabetes',
    'pr_meena',
    'Diabetes review',
    'patient_choice',
    60,
    31,
    true,
    'A focused check of blood sugar control and diabetes complications.',
    [
      { type: 'consultation', quantity: 2, label: '2 consultations' },
      { type: 'lab', quantity: 2, label: 'HbA1c and lipid profile' },
      { type: 'session', quantity: 1, label: 'Diabetic foot check' },
      { type: 'report', quantity: 1, label: 'Eye screening referral' },
    ],
  ),
  P(
    'pkg_heart',
    'pr_rohan',
    'Heart health check',
    'onsite',
    30,
    12,
    true,
    'Tests and a cardiology review in one visit.',
    [
      { type: 'consultation', quantity: 1, label: '1 on-site consultation' },
      { type: 'lab', quantity: 2, label: 'ECG and echocardiogram' },
      { type: 'lab', quantity: 2, label: 'Lipid profile and blood sugar' },
      { type: 'report', quantity: 1, label: 'Written summary for your records' },
    ],
  ),
  P(
    'pkg_second',
    'pr_anaya',
    'Second opinion',
    'remote',
    14,
    7,
    true,
    'An independent review of your diagnosis and treatment plan.',
    [
      { type: 'consultation', quantity: 1, label: '1 video consultation, 40 minutes' },
      { type: 'report', quantity: 1, label: 'Review of reports you upload' },
      { type: 'report', quantity: 1, label: 'Written opinion within 48 hours' },
    ],
  ),
  P('pkg_baby', 'pr_kabita', 'Baby’s first year', 'onsite', 365, 9, true, 'Well-baby visits through the first year.', [
    { type: 'consultation', quantity: 5, label: '5 well-baby visits' },
    { type: 'session', quantity: 5, label: 'Growth and development checks' },
    { type: 'messaging', quantity: 1, label: 'Vaccination schedule reminders' },
  ]),
  P(
    'pkg_knee',
    'pr_suresh',
    'Knee pain programme',
    'hybrid',
    60,
    0,
    false,
    'Assessment, imaging and physiotherapy follow-up for knee pain.',
    [
      { type: 'consultation', quantity: 1, label: '1 on-site consultation' },
      { type: 'lab', quantity: 1, label: 'Knee X-ray' },
      { type: 'session', quantity: 4, label: '4 physiotherapy sessions' },
      { type: 'consultation', quantity: 1, label: '1 video follow-up' },
    ],
  ),
  P(
    'pkg_skin',
    'pr_nisha',
    'Skin care follow-up',
    'remote',
    45,
    4,
    true,
    'Track a skin condition with photo reviews between video visits.',
    [
      { type: 'consultation', quantity: 2, label: '2 video consultations' },
      { type: 'report', quantity: 1, label: 'Photo review between visits' },
      { type: 'report', quantity: 1, label: 'Treatment plan updates' },
    ],
  ),
]

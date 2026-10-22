export interface SeedPractitioner {
  readonly id: string
  readonly staffId: string | null
  readonly displayName: string
  readonly category: string
  readonly qualifications: string
  readonly languages: readonly string[]
  readonly keywords: readonly string[]
  readonly offersOnsite: boolean
  readonly offersRemote: boolean
  readonly location: string
  readonly room: string
}

const D = (
  id: string,
  displayName: string,
  category: string,
  qualifications: string,
  languages: string,
  keywords: string,
  modes: { onsite: boolean; remote: boolean },
  room: string,
  staffId: string | null = null,
): SeedPractitioner => ({
  id,
  staffId,
  displayName,
  category,
  qualifications,
  languages: languages.split(', '),
  keywords: keywords.split(' '),
  offersOnsite: modes.onsite,
  offersRemote: modes.remote,
  location: `OPD Block B, ${room}`,
  room,
})

const BOTH = { onsite: true, remote: true }

export const PRACTITIONERS: readonly SeedPractitioner[] = [
  D(
    'pr_karki',
    'Dr. Prakash Karki',
    'Nephrology',
    'MD, DM Nephrology',
    'Nepali, English',
    'kidney ckd dialysis',
    BOTH,
    'Room 5',
    'st_prakash',
  ),
  D(
    'pr_anaya',
    'Dr. Anaya Shrestha',
    'Internal Medicine',
    'MD Internal Medicine',
    'Nepali, English, Hindi',
    'fever general bp',
    BOTH,
    'Room 3',
    'st_anaya',
  ),
  D(
    'pr_sabina',
    'Dr. Sabina Thapa Magar',
    'Internal Medicine',
    'MD Internal Medicine',
    'Nepali, English',
    'fever general',
    { onsite: true, remote: false },
    'Room 7',
  ),
  D(
    'pr_rohan',
    'Dr. Rohan Adhikari',
    'Cardiology',
    'MD, DM Cardiology',
    'Nepali, English',
    'heart chest bp',
    BOTH,
    'Room 4',
  ),
  D(
    'pr_meena',
    'Dr. Meena Rai',
    'Endocrinology',
    'MD, DM Endocrinology',
    'Nepali, English',
    'diabetes thyroid sugar',
    BOTH,
    'Room 6',
  ),
  D(
    'pr_suresh',
    'Dr. Suresh Bhattarai',
    'Orthopaedics',
    'MS Orthopaedics',
    'Nepali, English',
    'bone joint knee back',
    { onsite: true, remote: false },
    'Room 9',
  ),
  D(
    'pr_kabita',
    'Dr. Kabita Gurung',
    'Paediatrics',
    'MD Paediatrics',
    'Nepali, English',
    'child baby vaccine',
    BOTH,
    'Room 2',
  ),
  D(
    'pr_nisha',
    'Dr. Nisha Pradhan',
    'Dermatology',
    'MD Dermatology',
    'Nepali, English',
    'skin rash acne',
    { onsite: false, remote: true },
    'Room 8',
  ),
]

export const CATEGORIES = [
  'Internal Medicine',
  'Nephrology',
  'Cardiology',
  'Endocrinology',
  'Orthopaedics',
  'Paediatrics',
  'Dermatology',
] as const

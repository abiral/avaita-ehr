import type { LabCategory } from '@/domain/labs/types'
import { k } from './time'

export interface SeedRange {
  readonly low: number | null
  readonly high: number | null
  readonly criticalLow: number | null
  readonly criticalHigh: number | null
}

export interface SeedAnalyte {
  readonly code: string
  readonly name: string
  readonly value: number
  readonly unit: string
  readonly range: SeedRange
  readonly history: readonly { readonly at: string; readonly value: number }[]
}

export interface SeedResult {
  readonly id: string
  readonly patientId: string
  readonly panel: string
  readonly accession: string
  readonly collectedAt: string
  readonly reportedAt: string
  readonly orderedBy: string
  readonly analytes: readonly SeedAnalyte[]
  readonly preliminary: boolean
  readonly acknowledgedBy: string | null
  readonly acknowledgedAt: string | null
  readonly releasedToPatient: boolean
  readonly patientComment: string
  readonly seenByPatient: boolean
}

const R = (
  low: number | null,
  high: number | null,
  criticalLow: number | null = null,
  criticalHigh: number | null = null,
): SeedRange => ({ low, high, criticalLow, criticalHigh })
const H = (values: readonly number[], dates: readonly string[]) =>
  values.map((value, i) => ({ value, at: k(dates[i] ?? '2026-10-17', '05:40') }))
const LAST3 = ['2026-10-17', '2026-10-18', '2026-10-19']
const N = (
  code: string,
  name: string,
  value: number,
  unit: string,
  range: SeedRange,
  history: SeedAnalyte['history'] = [],
): SeedAnalyte => ({ code, name, value, unit, range, history })

const base = {
  preliminary: false,
  acknowledgedBy: null,
  acknowledgedAt: null,
  releasedToPatient: false,
  patientComment: '',
  seenByPatient: true,
}

export const RESULTS: readonly SeedResult[] = [
  {
    ...base,
    id: 'res_ram_renal',
    patientId: 'pt_ram',
    panel: 'Renal function panel',
    accession: 'L-2610-55812',
    collectedAt: k('2026-10-20', '05:40'),
    reportedAt: k('2026-10-20', '06:10'),
    orderedBy: 'Dr. Anaya Shrestha',
    analytes: [
      N('K', 'Potassium', 6.1, 'mmol/L', R(3.5, 5.1, 2.8, 6.0), H([4.9, 5.2, 5.6], LAST3)),
      N('CREAT', 'Creatinine', 168, 'µmol/L', R(62, 106), H([171, 170, 166], LAST3)),
      N('EGFR', 'eGFR', 34, 'mL/min', R(60, null), H([33, 33, 35], LAST3)),
      N('UREA', 'Urea', 11.4, 'mmol/L', R(2.5, 7.8), H([12.1, 11.8, 11.2], LAST3)),
      N('NA', 'Sodium', 136, 'mmol/L', R(135, 145, 120, 160), H([134, 135, 136], LAST3)),
      N('HCO3', 'Bicarbonate', 21, 'mmol/L', R(22, 29), H([22, 21, 21], LAST3)),
    ],
  },
  {
    ...base,
    id: 'res_ram_cbc',
    patientId: 'pt_ram',
    panel: 'Complete blood count and CRP',
    accession: 'L-2610-55790',
    collectedAt: k('2026-10-20', '05:40'),
    reportedAt: k('2026-10-20', '06:40'),
    orderedBy: 'Dr. Anaya Shrestha',
    acknowledgedBy: 'Dr. Anaya Shrestha',
    acknowledgedAt: k('2026-10-20', '07:05'),
    analytes: [N('WBC', 'WBC', 13.2, '×10⁹/L', R(4, 11)), N('CRP', 'CRP', 86, 'mg/L', R(null, 5))],
  },
  {
    ...base,
    id: 'res_sita',
    patientId: 'pt_sita',
    panel: 'NT-proBNP',
    accession: 'L-2610-55830',
    collectedAt: k('2026-10-20', '06:20'),
    reportedAt: k('2026-10-20', '07:02'),
    orderedBy: 'Dr. Anaya Shrestha',
    analytes: [N('BNP', 'NT-proBNP', 2140, 'pg/mL', R(null, 125))],
  },
  {
    ...base,
    id: 'res_deepak',
    patientId: 'pt_deepak',
    panel: 'Haemoglobin',
    accession: 'L-2610-55841',
    collectedAt: k('2026-10-20', '06:30'),
    reportedAt: k('2026-10-20', '07:15'),
    orderedBy: 'Dr. Anaya Shrestha',
    analytes: [N('HB', 'Haemoglobin', 8.9, 'g/dL', R(13, 17, 7, null), H([9.6, 9.2], ['2026-10-18', '2026-10-19']))],
  },
  {
    ...base,
    id: 'res_bikash',
    patientId: 'pt_bikash',
    panel: 'Venous blood gas',
    accession: 'L-2610-55852',
    collectedAt: k('2026-10-20', '07:20'),
    reportedAt: k('2026-10-20', '07:40'),
    orderedBy: 'Dr. Anaya Shrestha',
    analytes: [N('PH', 'pH', 7.38, '', R(7.35, 7.45, 7.2, 7.6)), N('HCO3', 'Bicarbonate', 23, 'mmol/L', R(22, 29))],
  },
  {
    ...base,
    id: 'res_kamala',
    patientId: 'pt_kamala',
    panel: 'Complete blood count',
    accession: 'L-2610-55803',
    collectedAt: k('2026-10-20', '05:50'),
    reportedAt: k('2026-10-20', '06:30'),
    orderedBy: 'Dr. Anaya Shrestha',
    analytes: [N('HB', 'Haemoglobin', 13.4, 'g/dL', R(12, 16)), N('WBC', 'WBC', 8.1, '×10⁹/L', R(4, 11))],
  },
  {
    ...base,
    id: 'res_hari',
    patientId: 'pt_hari',
    panel: 'Urine culture',
    accession: 'L-2610-55760',
    collectedAt: k('2026-10-19', '08:00'),
    reportedAt: k('2026-10-20', '05:55'),
    orderedBy: 'Dr. Anaya Shrestha',
    preliminary: true,
    analytes: [N('UCX', 'Colony count', 50, '×10³ CFU/mL', R(null, 100))],
  },
  // Ramesh Pandey, released to the portal (P8)
  {
    ...base,
    id: 'res_ramesh_kft',
    patientId: 'pt_ramesh',
    panel: 'Kidney function panel',
    accession: 'L-1910-44120',
    collectedAt: k('2026-10-19', '07:45'),
    reportedAt: k('2026-10-19', '10:10'),
    orderedBy: 'Dr. Prakash Karki',
    acknowledgedBy: 'Dr. Prakash Karki',
    acknowledgedAt: k('2026-10-19', '12:00'),
    releasedToPatient: true,
    seenByPatient: false,
    patientComment:
      'Your kidney numbers are a little higher than in August and potassium is slightly high. Please cut down on salty food and bananas, keep taking Losartan, and we will talk on 3 November.',
    analytes: [
      N('CREAT', 'Creatinine', 152, 'µmol/L', R(62, 106)),
      N('EGFR', 'eGFR', 42, 'mL/min', R(60, null)),
      N('UREA', 'Urea', 9.1, 'mmol/L', R(2.5, 7.8)),
      N('K', 'Potassium', 5.3, 'mmol/L', R(3.5, 5.1, 2.8, 6.0)),
      N('NA', 'Sodium', 139, 'mmol/L', R(135, 145)),
    ],
  },
  {
    ...base,
    id: 'res_ramesh_cbc',
    patientId: 'pt_ramesh',
    panel: 'Complete blood count',
    accession: 'L-1910-44121',
    collectedAt: k('2026-10-19', '07:45'),
    reportedAt: k('2026-10-19', '09:30'),
    orderedBy: 'Dr. Prakash Karki',
    acknowledgedBy: 'Dr. Prakash Karki',
    acknowledgedAt: k('2026-10-19', '12:00'),
    releasedToPatient: true,
    patientComment: 'Haemoglobin is slightly low, which is common with kidney disease. No action needed for now.',
    analytes: [
      N('HB', 'Haemoglobin', 12.8, 'g/dL', R(13, 17)),
      N('WBC', 'White cells', 7.2, '×10⁹/L', R(4, 11)),
      N('PLT', 'Platelets', 248, '×10⁹/L', R(150, 400)),
    ],
  },
  {
    ...base,
    id: 'res_ramesh_lipid',
    patientId: 'pt_ramesh',
    panel: 'Lipid profile',
    accession: 'L-0209-31002',
    collectedAt: k('2026-09-02', '07:45'),
    reportedAt: k('2026-09-02', '11:00'),
    orderedBy: 'Dr. Prakash Karki',
    acknowledgedBy: 'Dr. Prakash Karki',
    acknowledgedAt: k('2026-09-02', '13:00'),
    releasedToPatient: true,
    analytes: [
      N('CHOL', 'Total cholesterol', 4.6, 'mmol/L', R(null, 5.2)),
      N('LDL', 'LDL', 2.4, 'mmol/L', R(null, 3.4)),
      N('HDL', 'HDL', 1.2, 'mmol/L', R(1, 2)),
      N('TG', 'Triglycerides', 1.6, 'mmol/L', R(null, 1.7)),
    ],
  },
  {
    ...base,
    id: 'res_ramesh_a1c',
    patientId: 'pt_ramesh',
    panel: 'HbA1c',
    accession: 'L-0209-31003',
    collectedAt: k('2026-09-02', '07:45'),
    reportedAt: k('2026-09-02', '11:00'),
    orderedBy: 'Dr. Prakash Karki',
    acknowledgedBy: 'Dr. Prakash Karki',
    acknowledgedAt: k('2026-09-02', '13:00'),
    releasedToPatient: true,
    analytes: [N('A1C', 'HbA1c', 5.6, '%', R(null, 5.7))],
  },
]

export interface SeedTest {
  readonly code: string
  readonly name: string
  readonly category: LabCategory
  readonly specimen: string
  readonly turnaround: string
}

export const LAB_TESTS: readonly SeedTest[] = [
  { code: 'RFP', name: 'Renal function panel', category: 'chemistry', specimen: 'Blood, gold top', turnaround: '2 h' },
  { code: 'K', name: 'Potassium, plasma', category: 'chemistry', specimen: 'Blood, green top', turnaround: '1 h' },
  {
    code: 'VBG',
    name: 'Venous blood gas',
    category: 'chemistry',
    specimen: 'Blood, heparin syringe',
    turnaround: '15 min',
  },
  { code: 'MG', name: 'Magnesium', category: 'chemistry', specimen: 'Blood, gold top', turnaround: '2 h' },
  {
    code: 'UACR',
    name: 'Urine albumin to creatinine ratio',
    category: 'chemistry',
    specimen: 'Urine, spot sample',
    turnaround: '6 h',
  },
  { code: 'ECG', name: '12-lead ECG', category: 'cardiology', specimen: 'Cardiology technician', turnaround: '20 min' },
  {
    code: 'CBC',
    name: 'Complete blood count',
    category: 'haematology',
    specimen: 'Blood, purple top',
    turnaround: '1 h',
  },
  { code: 'COAG', name: 'Coagulation screen', category: 'haematology', specimen: 'Blood, blue top', turnaround: '2 h' },
  {
    code: 'BCX',
    name: 'Blood culture',
    category: 'microbiology',
    specimen: 'Blood culture bottles',
    turnaround: '48 h',
  },
  {
    code: 'UCX',
    name: 'Urine culture',
    category: 'microbiology',
    specimen: 'Urine, sterile container',
    turnaround: '24 h',
  },
  { code: 'CXR', name: 'Chest X-ray', category: 'imaging', specimen: 'Radiology', turnaround: '1 h' },
  { code: 'ECHO', name: 'Echocardiogram', category: 'cardiology', specimen: 'Cardiology', turnaround: '1 day' },
]

export const ORDER_SETS = [{ id: 'set_hyperk', name: 'Hyperkalaemia work-up', testCodes: ['RFP', 'K', 'VBG', 'ECG'] }]

/** Tests collected recently per patient, for the duplicate warning in C7. */
export const RECENT_COLLECTIONS = [{ patientId: 'pt_ram', testCode: 'RFP', collectedAt: k('2026-10-20', '06:10') }]

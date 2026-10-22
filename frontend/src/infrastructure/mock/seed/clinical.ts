import type { NoteSectionKey, ProblemStatus } from '@/domain/clinical/types'
import { k } from './time'

type VitalKey = 'temperature' | 'heartRate' | 'bloodPressure' | 'respiratoryRate' | 'spo2'

export interface SeedChart {
  readonly patientId: string
  readonly codeStatus: string
  readonly vitals: readonly { key: VitalKey; display: string; unit: string; trend: readonly number[]; note: string }[]
  readonly vitalsTakenAt: string | null
  readonly vitalsTakenBy: string
  readonly problems: readonly { name: string; detail: string; status: ProblemStatus }[]
  readonly medications: readonly { name: string; detail: string }[]
  readonly careTeam: readonly { name: string; role: string }[]
}

export const CHARTS: readonly SeedChart[] = [
  {
    patientId: 'pt_ram',
    codeStatus: 'Full code',
    vitals: [
      { key: 'temperature', display: '37.8', unit: '°C', trend: [38.6, 38.2, 37.9, 37.8], note: 'Down from 38.6' },
      { key: 'heartRate', display: '88', unit: 'bpm', trend: [104, 98, 92, 88], note: 'Down from 104' },
      { key: 'bloodPressure', display: '138/82', unit: 'mmHg', trend: [146, 142, 140, 138], note: 'Systolic shown' },
      { key: 'respiratoryRate', display: '20', unit: '/min', trend: [24, 22, 22, 20], note: 'Down from 24' },
      { key: 'spo2', display: '94', unit: '%', trend: [90, 92, 93, 94], note: 'On 2 L nasal oxygen' },
    ],
    vitalsTakenAt: k('2026-10-20', '08:10'),
    vitalsTakenBy: 'Nurse Pema',
    problems: [
      {
        name: 'Community-acquired pneumonia, right lower lobe',
        detail: 'Since 17 Oct · CURB-65 score 2',
        status: 'active',
      },
      { name: 'Hyperkalaemia', detail: 'Since 20 Oct', status: 'new' },
      { name: 'Chronic kidney disease, stage 3b', detail: 'Since 2019 · eGFR 34', status: 'chronic' },
      { name: 'Type 2 diabetes', detail: 'Since 2012 · Last HbA1c 7.4%', status: 'chronic' },
    ],
    medications: [
      { name: 'Ceftriaxone 1 g IV', detail: 'Every 24 hours · Day 4 of 7' },
      { name: 'Azithromycin 500 mg oral', detail: 'Once daily · Day 4 of 5' },
      { name: 'Insulin glargine 14 units SC', detail: 'At 22:00' },
      { name: 'Amlodipine 5 mg oral', detail: 'Once daily' },
      { name: 'Heparin 5,000 units SC', detail: 'Every 12 hours' },
    ],
    careTeam: [
      { name: 'Dr. Anaya Shrestha', role: 'Attending' },
      { name: 'Dr. Prakash Karki', role: 'Nephrology' },
      { name: 'Pema Sherpa, RN', role: 'Primary nurse' },
    ],
  },
]

export const DEFAULT_CARE_TEAM = [{ name: 'Pema Sherpa, RN', role: 'Primary nurse' }]

export interface SeedNote {
  readonly id: string
  readonly patientId: string
  readonly template: string
  readonly title: string
  readonly department: string
  readonly status: 'draft' | 'signed'
  readonly sections: Readonly<Record<NoteSectionKey, string>>
  readonly plan: readonly { text: string; orderStatus: 'none' | 'ordered' | 'lab-ordered' }[]
  readonly authorId: string
  readonly authorName: string
  readonly createdAt: string
  readonly savedAt: string | null
  readonly signedAt: string | null
  readonly needsCosign: boolean
}

const EMPTY = { reason: '', history: '', examination: '', assessment: '', followUp: '' }
const signed = (
  id: string,
  patientId: string,
  title: string,
  authorName: string,
  at: string,
  needsCosign = false,
): SeedNote => ({
  id,
  patientId,
  template: title,
  title,
  department: 'Internal Medicine',
  status: needsCosign ? 'draft' : 'signed',
  sections: EMPTY,
  plan: [],
  authorId: 'other',
  authorName,
  createdAt: at,
  savedAt: at,
  signedAt: needsCosign ? null : at,
  needsCosign,
})

export const NOTES: readonly SeedNote[] = [
  {
    id: 'note_ram_cons',
    patientId: 'pt_ram',
    template: 'Consultation · Internal Medicine',
    title: 'Consultation note',
    department: 'Internal Medicine',
    status: 'draft',
    sections: {
      reason: 'Day 4 of treatment for right lower lobe pneumonia. New potassium 6.1 mmol/L on morning bloods.',
      history:
        'Feels less breathless. Cough productive, less sputum. No chest pain or palpitations. Eating and drinking well. Urine output 1.2 L over 24 h.',
      examination:
        'Alert, speaking full sentences. Crackles right base, improved. Heart sounds normal. No peripheral oedema.',
      assessment:
        '1. Community-acquired pneumonia, improving on ceftriaxone and azithromycin.\n2. Hyperkalaemia, moderate, likely CKD with reduced clearance. No ECG changes on monitor so far.\n3. CKD stage 3b, creatinine stable at 168.',
      followUp: 'Review potassium result at 11:00. Discuss with nephrology if above 6.0 on repeat.',
    },
    plan: [
      { text: 'Repeat renal panel and potassium, urgent', orderStatus: 'lab-ordered' },
      { text: '12-lead ECG now', orderStatus: 'ordered' },
      { text: 'Calcium gluconate 10% 10 mL IV if ECG changes', orderStatus: 'none' },
      { text: 'Low-potassium diet, stop potassium-rich supplements', orderStatus: 'none' },
      { text: 'Continue antibiotics; switch to oral on day 5 if afebrile', orderStatus: 'none' },
    ],
    authorId: 'st_anaya',
    authorName: 'Dr. Anaya Shrestha',
    createdAt: k('2026-10-20', '09:05'),
    savedAt: k('2026-10-20', '09:18'),
    signedAt: null,
    needsCosign: false,
  },
  signed('note_ram_prog', 'pt_ram', 'Progress note', 'Dr. Shrestha', k('2026-10-19', '09:40')),
  signed('note_ram_neph', 'pt_ram', 'Nephrology consultation', 'Dr. Prakash Karki', k('2026-10-18', '15:05')),
  signed('note_ram_adm', 'pt_ram', 'Admission history and physical', 'Dr. Bijay Lama', k('2026-10-17', '22:30')),
  signed('note_bikash_adm', 'pt_bikash', 'Admission note', 'Dr. Prakash Karki', k('2026-10-20', '01:10'), true),
  signed('note_maya_prog', 'pt_maya', 'Progress note', 'Dr. Anaya Shrestha', k('2026-10-19', '10:10'), true),
]

export const AGENDA = [
  { at: k('2026-10-20', '08:30'), what: 'Ward round, 4B' },
  { at: k('2026-10-20', '11:30'), what: 'Family meeting, Maya Tamang' },
  { at: k('2026-10-20', '13:00'), what: 'Multidisciplinary team review' },
  { at: k('2026-10-20', '15:30'), what: 'Handover to evening cover' },
]

export const MED_RECONCILIATION = [{ patientId: 'pt_sita', title: 'Reconcile home medications' }]

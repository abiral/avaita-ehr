import { z } from 'zod'
import { NOTE_SECTION_KEYS, NOTE_STATUSES, PATIENT_FLAGS, PROBLEM_STATUSES, SEXES } from '@/domain/clinical/types'
import { IsoDateTime, listOf, LocalDate } from '../common'

export const PatientListItemDto = z.object({
  id: z.string(),
  displayName: z.string(),
  sex: z.enum(SEXES),
  birthDate: LocalDate,
  mrn: z.string(),
  bed: z.string().nullable(),
  attendingName: z.string().nullable(),
  mine: z.boolean(),
  admittedAt: IsoDateTime.nullable(),
  diagnosis: z.string(),
  flags: z.array(z.enum(PATIENT_FLAGS)),
  next: z.string(),
  nextTone: z.enum(['neutral', 'info', 'alert']),
  seenAt: IsoDateTime.nullable(),
})
export type PatientListItemDto = z.infer<typeof PatientListItemDto>
export const PatientListDto = listOf(PatientListItemDto)

const PersonDto = z.object({ name: z.string(), role: z.string() })

export const BannerDto = z.object({
  id: z.string(),
  displayName: z.string(),
  sex: z.enum(SEXES),
  birthDate: LocalDate,
  mrn: z.string(),
  bed: z.string().nullable(),
  ward: z.string().nullable(),
  admittedAt: IsoDateTime.nullable(),
  attendingName: z.string().nullable(),
  allergies: z.array(z.object({ substance: z.string(), reaction: z.string() })),
  codeStatus: z.string(),
})

export const NoteSummaryDto = z.object({
  id: z.string(),
  title: z.string(),
  authorName: z.string(),
  at: IsoDateTime,
  status: z.enum(NOTE_STATUSES),
})

export const SummaryDto = z.object({
  banner: BannerDto,
  alert: z
    .object({ analyte: z.string(), value: z.string(), range: z.string(), at: IsoDateTime, resultId: z.string() })
    .nullable(),
  vitals: z.array(
    z.object({
      key: z.enum(['temperature', 'heartRate', 'bloodPressure', 'respiratoryRate', 'spo2']),
      display: z.string(),
      unit: z.string(),
      trend: z.array(z.number()),
      note: z.string(),
    }),
  ),
  vitalsTakenAt: IsoDateTime.nullable(),
  vitalsTakenBy: z.string(),
  problems: z.array(z.object({ name: z.string(), detail: z.string(), status: z.enum(PROBLEM_STATUSES) })),
  medications: z.array(z.object({ name: z.string(), detail: z.string() })),
  careTeam: z.array(PersonDto),
  notes: z.array(NoteSummaryDto),
})
export type SummaryDto = z.infer<typeof SummaryDto>

const Sections = z.object(
  Object.fromEntries(NOTE_SECTION_KEYS.map((k) => [k, z.string()])) as Record<
    (typeof NOTE_SECTION_KEYS)[number],
    z.ZodString
  >,
)
const PlanItemDto = z.object({ text: z.string(), orderStatus: z.enum(['none', 'ordered', 'lab-ordered']) })

export const NoteDto = z.object({
  id: z.string(),
  patientId: z.string(),
  template: z.string(),
  title: z.string(),
  department: z.string(),
  status: z.enum(NOTE_STATUSES),
  sections: Sections,
  plan: z.array(PlanItemDto),
  authorName: z.string(),
  createdAt: IsoDateTime,
  savedAt: IsoDateTime.nullable(),
  signedAt: IsoDateTime.nullable(),
  copyTo: z.array(PersonDto),
  addenda: z.array(z.object({ text: z.string(), at: IsoDateTime, authorName: z.string() })),
})
export type NoteDto = z.infer<typeof NoteDto>
export const NoteListDto = listOf(NoteDto)
export const NoteBody = z.object({ template: z.string(), sections: Sections, plan: z.array(PlanItemDto) })
export const AddendumBody = z.object({ text: z.string().min(1) })

export const TodayDto = z.object({
  attention: z.array(
    z.object({
      kind: z.enum(['critical-result', 'cosign', 'medication']),
      title: z.string(),
      patientName: z.string(),
      context: z.string(),
      target: z.object({ type: z.enum(['result', 'note', 'chart']), id: z.string(), patientId: z.string() }),
    }),
  ),
  agenda: z.array(z.object({ at: IsoDateTime, what: z.string() })),
  notesToSign: z.number().int().min(0),
  plannedDischarges: z.number().int().min(0),
})

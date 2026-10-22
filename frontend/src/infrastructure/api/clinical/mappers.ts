import type { NoteId, PatientId } from '@/core/branded'
import type { StaffToday } from '@/application/ports'
import type { ClinicalNote, PatientListItem, PatientSummary } from '@/domain/clinical/types'
import type { z } from 'zod'
import { toDate, toDateOrNull } from '../common'
import type { NoteDto, PatientListItemDto, SummaryDto, TodayDto } from './dto'

export const toPatientListItem = (dto: PatientListItemDto): PatientListItem => ({
  ...dto,
  id: dto.id as PatientId,
  admittedAt: toDateOrNull(dto.admittedAt),
  seenAt: toDateOrNull(dto.seenAt),
})

export const toSummary = (dto: SummaryDto): PatientSummary => ({
  ...dto,
  banner: { ...dto.banner, id: dto.banner.id as PatientId, admittedAt: toDateOrNull(dto.banner.admittedAt) },
  alert: dto.alert ? { ...dto.alert, at: toDate(dto.alert.at) } : null,
  vitalsTakenAt: toDateOrNull(dto.vitalsTakenAt),
  notes: dto.notes.map((n) => ({ ...n, id: n.id as NoteId, at: toDate(n.at) })),
})

export const toNote = (dto: NoteDto): ClinicalNote => ({
  ...dto,
  id: dto.id as NoteId,
  patientId: dto.patientId as PatientId,
  createdAt: toDate(dto.createdAt),
  savedAt: toDateOrNull(dto.savedAt),
  signedAt: toDateOrNull(dto.signedAt),
  addenda: dto.addenda.map((a) => ({ ...a, at: toDate(a.at) })),
})

export const toToday = (dto: z.infer<typeof TodayDto>): StaffToday => ({
  ...dto,
  agenda: dto.agenda.map((a) => ({ ...a, at: toDate(a.at) })),
})

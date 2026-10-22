import type { LabOrderId, LabResultId, PatientId } from '@/core/branded'
import type { InboxItem, LabOrder, LabResult, PatientReport, RecentCollection } from '@/domain/labs/types'
import type { z } from 'zod'
import { toDate, toDateOrNull } from '../common'
import type { InboxItemDto, LabOrderDto, LabResultDto, RecentListDto, ReportDto } from './dto'

export const toLabResult = (dto: LabResultDto): LabResult => ({
  ...dto,
  id: dto.id as LabResultId,
  patientId: dto.patientId as PatientId,
  collectedAt: toDate(dto.collectedAt),
  reportedAt: toDate(dto.reportedAt),
  acknowledgedAt: toDateOrNull(dto.acknowledgedAt),
  analytes: dto.analytes.map((a) => ({ ...a, history: a.history.map((h) => ({ value: h.value, at: toDate(h.at) })) })),
})

export const toInboxItem = (dto: z.infer<typeof InboxItemDto>): InboxItem => ({
  ...dto,
  id: dto.id as LabResultId,
  reportedAt: toDate(dto.reportedAt),
})

export const toReport = (dto: z.infer<typeof ReportDto>): PatientReport => ({
  ...dto,
  id: dto.id as LabResultId,
  collectedAt: toDate(dto.collectedAt),
})

export const toRecent = (dto: z.infer<typeof RecentListDto>['items'][number]): RecentCollection => ({
  testCode: dto.testCode,
  collectedAt: toDate(dto.collectedAt),
})

export const toLabOrder = (dto: z.infer<typeof LabOrderDto>): LabOrder => ({
  ...dto,
  id: dto.id as LabOrderId,
  patientId: dto.patientId as PatientId,
  placedAt: toDate(dto.placedAt),
})

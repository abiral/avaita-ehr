import { z } from 'zod'
import { LAB_CATEGORIES, LAB_FLAGS, PRIORITIES, REVIEW_STATUSES } from '@/domain/labs/types'
import { IsoDateTime, listOf } from '../common'

export const RangeDto = z.object({
  low: z.number().nullable(),
  high: z.number().nullable(),
  criticalLow: z.number().nullable(),
  criticalHigh: z.number().nullable(),
})

export const AnalyteDto = z.object({
  code: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  range: RangeDto,
  history: z.array(z.object({ at: IsoDateTime, value: z.number() })),
})

export const LabResultDto = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  mrn: z.string(),
  panel: z.string(),
  accession: z.string(),
  collectedAt: IsoDateTime,
  reportedAt: IsoDateTime,
  orderedBy: z.string(),
  analytes: z.array(AnalyteDto),
  preliminary: z.boolean(),
  review: z.enum(REVIEW_STATUSES),
  acknowledgedBy: z.string().nullable(),
  acknowledgedAt: IsoDateTime.nullable(),
  releasedToPatient: z.boolean(),
  patientComment: z.string(),
})
export type LabResultDto = z.infer<typeof LabResultDto>

export const InboxItemDto = z.object({
  id: z.string(),
  patientName: z.string(),
  panel: z.string(),
  reportedAt: IsoDateTime,
  worstFlag: z.enum(LAB_FLAGS),
  preliminary: z.boolean(),
  review: z.enum(REVIEW_STATUSES),
})
export const InboxDto = listOf(InboxItemDto)

export const ReportDto = z.object({
  id: z.string(),
  panel: z.string(),
  collectedAt: IsoDateTime,
  orderedBy: z.string(),
  reviewedBy: z.string().nullable(),
  isNew: z.boolean(),
  comment: z.string(),
  analytes: z.array(AnalyteDto.omit({ history: true })),
})
export const ReportListDto = listOf(ReportDto)

export const CatalogueDto = z.object({
  tests: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      category: z.enum(LAB_CATEGORIES),
      specimen: z.string(),
      turnaround: z.string(),
    }),
  ),
  orderSets: z.array(z.object({ id: z.string(), name: z.string(), testCodes: z.array(z.string()) })),
})

export const RecentListDto = listOf(z.object({ testCode: z.string(), collectedAt: IsoDateTime }))

export const LabOrderBody = z.object({
  patientId: z.string(),
  items: z.array(z.object({ testCode: z.string(), priority: z.enum(PRIORITIES), collect: z.string() })).min(1),
  indication: z.string().min(1),
})
export const LabOrderDto = z.object({
  id: z.string(),
  patientId: z.string(),
  placedAt: IsoDateTime,
  itemCount: z.number().int().positive(),
})
export const ReleaseBody = z.object({ comment: z.string() })

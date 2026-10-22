import { z } from 'zod'
import { PACKAGE_FORMATS, PACKAGE_ITEM_TYPES } from '@/domain/packages/types'
import { VISIT_MODES } from '@/domain/scheduling/types'
import { IsoDateTime, listOf, MoneyDto } from '../common'

export const PackageItemDto = z.object({
  type: z.enum(PACKAGE_ITEM_TYPES),
  quantity: z.number().int().positive(),
  label: z.string(),
})

export const PackageDto = z.object({
  id: z.string(),
  practitionerId: z.string(),
  practitionerName: z.string(),
  category: z.string(),
  name: z.string(),
  description: z.string(),
  format: z.enum(PACKAGE_FORMATS),
  validityDays: z.number().int().positive(),
  price: MoneyDto.nullable(),
  monthlyCap: z.number().int().positive().nullable(),
  published: z.boolean(),
  items: z.array(PackageItemDto),
  bookedCount: z.number().int().min(0),
})
export type PackageDto = z.infer<typeof PackageDto>
export const PackageListDto = listOf(PackageDto)

export const PackageBody = PackageDto.omit({ id: true, practitionerName: true, category: true, bookedCount: true })

export const EnrollmentDto = z.object({
  id: z.string(),
  packageId: z.string(),
  chosenFormat: z.enum(PACKAGE_FORMATS),
  start: IsoDateTime,
  expires: IsoDateTime,
  firstAppointmentId: z.string(),
})
export const EnrollmentBody = z.object({
  packageId: z.string(),
  chosenFormat: z.enum(PACKAGE_FORMATS),
  firstVisit: z.object({ start: IsoDateTime, mode: z.enum(VISIT_MODES) }),
})

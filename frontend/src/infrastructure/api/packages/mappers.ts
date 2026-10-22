import type { PackageId, PractitionerId } from '@/core/branded'
import type { ConsultationPackage, PackageEnrollment } from '@/domain/packages/types'
import type { z } from 'zod'
import { toDate } from '../common'
import type { EnrollmentDto, PackageDto } from './dto'

export const toPackage = (dto: PackageDto): ConsultationPackage => ({
  ...dto,
  id: dto.id as PackageId,
  practitionerId: dto.practitionerId as PractitionerId,
})

export const toEnrollment = (dto: z.infer<typeof EnrollmentDto>): PackageEnrollment => ({
  ...dto,
  packageId: dto.packageId as PackageId,
  start: toDate(dto.start),
  expires: toDate(dto.expires),
})

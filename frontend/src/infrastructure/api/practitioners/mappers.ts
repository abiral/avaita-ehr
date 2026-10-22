import type { PractitionerId } from '@/core/branded'
import type { Practitioner } from '@/domain/scheduling/types'
import { toDateOrNull } from '../common'
import type { PractitionerDto } from './dto'

export const toPractitioner = (dto: PractitionerDto): Practitioner => ({
  ...dto,
  id: dto.id as PractitionerId,
  nextAvailableAt: toDateOrNull(dto.nextAvailableAt),
})

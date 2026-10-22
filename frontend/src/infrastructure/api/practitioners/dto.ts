import { z } from 'zod'
import { IsoDateTime, listOf } from '../common'

export const PractitionerDto = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.string(),
  qualifications: z.string(),
  languages: z.array(z.string()),
  keywords: z.array(z.string()),
  offersOnsite: z.boolean(),
  offersRemote: z.boolean(),
  location: z.string(),
  nextAvailableAt: IsoDateTime.nullable(),
})
export type PractitionerDto = z.infer<typeof PractitionerDto>
export const PractitionerListDto = listOf(PractitionerDto)

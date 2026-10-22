import { z } from 'zod'

export const IsoDateTime = z.iso.datetime({ offset: true })
export const FacilityDto = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  timeZone: z.string(),
})
export type FacilityDto = z.infer<typeof FacilityDto>

export const page = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() })

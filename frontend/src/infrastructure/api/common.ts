import { z } from 'zod'

export const IsoDateTime = z.iso.datetime({ offset: true })
export const LocalDate = z.iso.date()
export const LocalTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const FacilityDto = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  timeZone: z.string(),
})
export type FacilityDto = z.infer<typeof FacilityDto>

export const MoneyDto = z.object({ minor: z.number().int(), currency: z.string().length(3) })

export const listOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() })

export const toDate = (iso: string): Date => new Date(iso)
export const toDateOrNull = (iso: string | null): Date | null => (iso ? new Date(iso) : null)
export const iso = (d: Date): string => d.toISOString()

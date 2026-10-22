import { z } from 'zod'
import { LocalDate } from '../common'

export const RegistrationBody = z.object({
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  birthDate: LocalDate,
  sex: z.enum(['male', 'female', 'other', 'undisclosed']),
  mobile: z.string().min(7),
  email: z.email(),
  password: z.string().min(10),
  hospitalNumber: z.string(),
  acceptedTerms: z.literal(true),
})
export const RegistrationDto = z.object({ id: z.string(), maskedMobile: z.string() })
export const VerifyBody = z.object({ code: z.string().regex(/^\d{6}$/) })
export const VerifiedDto = z.object({
  mrn: z.string(),
  facilityName: z.string().nullable(),
  linked: z.object({
    visits: z.number().int().min(0),
    labReports: z.number().int().min(0),
    medicines: z.number().int().min(0),
  }),
})

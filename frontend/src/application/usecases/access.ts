import type { RegistrationInput, RegistrationRepository, SessionRepository } from '../ports'
import { ApiError } from '@/core/errors'
import type { RegistrationId } from '@/core/branded'
import { checkPassword, passwordOk } from '@/domain/identity'
import { outcome, type Outcome } from './outcome'

const invalid = (fields: Record<string, string>) => new ApiError('Check the fields', 'validation_failed', 422, fields)

const registrationProblems = (input: RegistrationInput): Record<string, string> => {
  const fields: Record<string, string> = {}
  if (!input.givenName.trim()) fields.givenName = 'required'
  if (!input.familyName.trim()) fields.familyName = 'required'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) fields.birthDate = 'invalid'
  if (input.mobile.replace(/\D/g, '').length < 7) fields.mobile = 'invalid'
  if (!/^\S+@\S+\.\S+$/.test(input.email)) fields.email = 'invalid'
  const pw = checkPassword(input.password)
  if (!pw.length || !pw.number) fields.password = 'weak'
  if (!input.acceptedTerms) fields.acceptedTerms = 'terms'
  return fields
}

/** P2 step 1: validates locally (same rules as the server) before sending. */
export const register =
  (deps: { registration: Pick<RegistrationRepository, 'register'> }) => async (input: RegistrationInput) => {
    const fields = registrationProblems(input)
    if (Object.keys(fields).length) throw invalid(fields)
    return outcome(await deps.registration.register(input))
  }

/** P2 step 2: verifies the code, then loads the session the server started. */
export const verifyRegistration =
  (deps: { registration: Pick<RegistrationRepository, 'verify'>; session: Pick<SessionRepository, 'current'> }) =>
  async (input: { id: RegistrationId; code: string }) => {
    if (!/^\d{6}$/.test(input.code)) throw new ApiError('Wrong code', 'invalid_code', 422, { code: 'invalid' })
    const verified = await deps.registration.verify(input.id, input.code)
    const session = await deps.session.current()
    return outcome({ verified, session })
  }

export const requestPasswordReset =
  (deps: { session: Pick<SessionRepository, 'requestPasswordReset'> }) =>
  async (identifier: string): Promise<Outcome<{ maskedDestination: string }>> => {
    if (!identifier.trim()) throw invalid({ identifier: 'required' })
    return outcome(await deps.session.requestPasswordReset(identifier.trim()))
  }

export const confirmPasswordReset =
  (deps: { session: Pick<SessionRepository, 'confirmPasswordReset'> }) =>
  async (input: { token: string; password: string; confirm: string }): Promise<Outcome<true>> => {
    if (!passwordOk(checkPassword(input.password, input.confirm))) throw invalid({ password: 'weak' })
    await deps.session.confirmPasswordReset({ token: input.token, password: input.password })
    return outcome(true as const)
  }

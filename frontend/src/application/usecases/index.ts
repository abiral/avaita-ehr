import type { Clock } from '@/core/clock'
import type { RegistrationRepository, SessionRepository } from '../ports'
import { confirmPasswordReset, register, requestPasswordReset, verifyRegistration } from './access'

export interface UseCaseDeps {
  readonly clock: Clock
  readonly repos: {
    readonly session: SessionRepository
    readonly registration: RegistrationRepository
  }
}

/** Builds every use case from repositories (called once in the composition root). */
export function createUseCases({ repos }: UseCaseDeps) {
  return {
    register: register({ registration: repos.registration }),
    verifyRegistration: verifyRegistration({ registration: repos.registration, session: repos.session }),
    requestPasswordReset: requestPasswordReset({ session: repos.session }),
    confirmPasswordReset: confirmPasswordReset({ session: repos.session }),
  }
}

export type UseCases = ReturnType<typeof createUseCases>
export type { Outcome, Warning } from './outcome'

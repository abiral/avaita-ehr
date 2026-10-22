import type { Clock } from '@/core/clock'
import type { RegistrationRepository, SchedulingRepository, SessionRepository } from '../ports'
import { confirmPasswordReset, register, requestPasswordReset, verifyRegistration } from './access'
import { createTimeOff, previewTimeOff, saveAvailabilityBlock, saveBookingRules } from './scheduling'

export interface UseCaseDeps {
  readonly clock: Clock
  readonly repos: {
    readonly session: SessionRepository
    readonly registration: RegistrationRepository
    readonly scheduling: SchedulingRepository
  }
}

/** Builds every use case from repositories (called once in the composition root). */
export function createUseCases({ repos }: UseCaseDeps) {
  return {
    register: register({ registration: repos.registration }),
    verifyRegistration: verifyRegistration({ registration: repos.registration, session: repos.session }),
    requestPasswordReset: requestPasswordReset({ session: repos.session }),
    confirmPasswordReset: confirmPasswordReset({ session: repos.session }),
    saveAvailabilityBlock: saveAvailabilityBlock({ scheduling: repos.scheduling }),
    saveBookingRules: saveBookingRules({ scheduling: repos.scheduling }),
    previewTimeOff: previewTimeOff({ scheduling: repos.scheduling }),
    createTimeOff: createTimeOff({ scheduling: repos.scheduling }),
  }
}

export type UseCases = ReturnType<typeof createUseCases>
export type { Outcome, Warning } from './outcome'

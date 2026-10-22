import type { Clock } from '@/core/clock'
import type { AppointmentRepository, RegistrationRepository, SchedulingRepository, SessionRepository } from '../ports'
import { bookAppointment, cancelAppointment, rescheduleAppointment } from './appointments'
import { confirmPasswordReset, register, requestPasswordReset, verifyRegistration } from './access'
import { createTimeOff, previewTimeOff, saveAvailabilityBlock, saveBookingRules } from './scheduling'

export interface UseCaseDeps {
  readonly clock: Clock
  readonly repos: {
    readonly session: SessionRepository
    readonly registration: RegistrationRepository
    readonly scheduling: SchedulingRepository
    readonly appointments: AppointmentRepository
  }
}

/** Builds every use case from repositories (called once in the composition root). */
export function createUseCases({ repos, clock }: UseCaseDeps) {
  return {
    register: register({ registration: repos.registration }),
    verifyRegistration: verifyRegistration({ registration: repos.registration, session: repos.session }),
    requestPasswordReset: requestPasswordReset({ session: repos.session }),
    confirmPasswordReset: confirmPasswordReset({ session: repos.session }),
    saveAvailabilityBlock: saveAvailabilityBlock({ scheduling: repos.scheduling }),
    saveBookingRules: saveBookingRules({ scheduling: repos.scheduling }),
    previewTimeOff: previewTimeOff({ scheduling: repos.scheduling }),
    createTimeOff: createTimeOff({ scheduling: repos.scheduling }),
    bookAppointment: bookAppointment({ appointments: repos.appointments, clock }),
    rescheduleAppointment: rescheduleAppointment({ appointments: repos.appointments, clock }),
    cancelAppointment: cancelAppointment({ appointments: repos.appointments, clock }),
  }
}

export type UseCases = ReturnType<typeof createUseCases>
export type { Outcome, Warning } from './outcome'

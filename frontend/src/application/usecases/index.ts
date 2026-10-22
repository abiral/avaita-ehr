import type { Clock } from '@/core/clock'
import type {
  AppointmentRepository,
  ClinicalRepository,
  LabRepository,
  MedicationRepository,
  PackageRepository,
  RegistrationRepository,
  SchedulingRepository,
  SessionRepository,
} from '../ports'
import { bookAppointment, cancelAppointment, rescheduleAppointment } from './appointments'
import { acknowledgeResult, addAddendum, placeLabOrder, releaseResult, saveNoteDraft, signNote } from './clinical'
import { confirmPasswordReset, register, requestPasswordReset, verifyRegistration } from './access'
import { decideRefill, requestRefill } from './medications'
import { bookPackage, savePackage } from './packages'
import { createTimeOff, previewTimeOff, saveAvailabilityBlock, saveBookingRules } from './scheduling'

export interface UseCaseDeps {
  readonly clock: Clock
  readonly repos: {
    readonly session: SessionRepository
    readonly registration: RegistrationRepository
    readonly scheduling: SchedulingRepository
    readonly appointments: AppointmentRepository
    readonly packages: PackageRepository
    readonly clinical: ClinicalRepository
    readonly labs: LabRepository
    readonly medications: MedicationRepository
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
    savePackage: savePackage({ packages: repos.packages }),
    bookPackage: bookPackage({ packages: repos.packages }),
    saveNoteDraft: saveNoteDraft({ clinical: repos.clinical }),
    signNote: signNote({ clinical: repos.clinical }),
    addAddendum: addAddendum({ clinical: repos.clinical }),
    placeLabOrder: placeLabOrder({ labs: repos.labs }),
    acknowledgeResult: acknowledgeResult({ labs: repos.labs }),
    releaseResult: releaseResult({ labs: repos.labs }),
    requestRefill: requestRefill({ medications: repos.medications }),
    decideRefill: decideRefill({ medications: repos.medications, clock }),
  }
}

export type UseCases = ReturnType<typeof createUseCases>
export type { Outcome, Warning } from './outcome'

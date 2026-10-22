import type { PatientId, PractitionerId, LabResultId } from '@/core/branded'
import { SchemaError } from '@/core/errors'
import { createHttpClient, type HttpRequest } from '../http'
import { createAppointmentRepository } from './appointments/repository'
import { createClinicalRepository } from './clinical/repository'
import { createLabRepository } from './labs/repository'
import { createMedicationRepository } from './medications/repository'
import { createPackageRepository } from './packages/repository'
import { createPractitionerRepository } from './practitioners/repository'
import { createRegistrationRepository } from './registration/repository'
import { createSchedulingRepository } from './scheduling/repository'
import { createSessionRepository } from './session/repository'
import { createTenancyRepository } from './tenancy/repository'

/** A server that answers every call with a body missing required fields. */
const broken = () => {
  const seen: HttpRequest[] = []
  const http = createHttpClient([], (req) => {
    seen.push(req)
    return Promise.resolve({ status: 200, headers: new Headers(), body: { items: [{ id: 'x' }], nextCursor: null } })
  })
  return { http, seen }
}

const range = { from: new Date('2026-10-20T00:00:00Z'), to: new Date('2026-10-21T00:00:00Z') }

describe('adapters reject responses that do not match the contract', () => {
  const { http, seen } = broken()
  it.each([
    ['session', () => createSessionRepository(http).signIn({ kind: 'patient', identifier: 'a', password: 'b' })],
    [
      'registration',
      () =>
        createRegistrationRepository(http).register({
          givenName: 'a',
          familyName: 'b',
          birthDate: '1990-01-01',
          sex: 'female',
          mobile: '1',
          email: 'a@b.c',
          password: 'x',
          hospitalNumber: '',
          acceptedTerms: true,
        }),
    ],
    ['tenancy', () => createTenancyRepository(http).myFacilities()],
    ['practitioners', () => createPractitionerRepository(http).list({ q: 'kidney' })],
    ['scheduling', () => createSchedulingRepository(http).slots('pr_karki' as PractitionerId, 'onsite', range)],
    ['appointments', () => createAppointmentRepository(http).listMine()],
    ['packages', () => createPackageRepository(http).list()],
    ['clinical', () => createClinicalRepository(http).summary('pt_ram' as PatientId)],
    ['labs', () => createLabRepository(http).result('res_1' as LabResultId)],
    ['medications', () => createMedicationRepository(http).queue()],
  ])('%s', async (_, run) => {
    await expect(run()).rejects.toBeInstanceOf(SchemaError)
  })

  it('sends search text in a header, never in the URL', () => {
    const list = seen.find((r) => r.path === '/practitioners')
    expect(list?.headers).toEqual({ 'X-Search': 'kidney' })
    expect(JSON.stringify(list?.query)).not.toContain('kidney')
  })
})

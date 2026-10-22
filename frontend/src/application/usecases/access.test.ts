import type { RegistrationId } from '@/core/branded'
import { ApiError } from '@/core/errors'
import { patientSession } from '@/test/fixtures/sessions'
import { confirmPasswordReset, register, requestPasswordReset, verifyRegistration } from './access'

const input = {
  givenName: 'Sushila',
  familyName: 'Karki',
  birthDate: '1990-04-02',
  sex: 'female' as const,
  mobile: '+977 9812345678',
  email: 'sushila@mail.com',
  password: 'kathmandu2026',
  hospitalNumber: '',
  acceptedTerms: true,
}

describe('access use cases', () => {
  it('registers valid input and reports every invalid field', async () => {
    const repo = {
      register: vi.fn(() => Promise.resolve({ id: 'reg_1' as RegistrationId, maskedMobile: '+977 98XX' })),
    }
    await expect(register({ registration: repo })(input)).resolves.toMatchObject({
      value: { id: 'reg_1' },
      warnings: [],
    })
    const bad = {
      ...input,
      givenName: ' ',
      familyName: '',
      birthDate: '12/03/1965',
      mobile: '12',
      email: 'x',
      password: 'short',
      acceptedTerms: false,
    }
    const e = await register({ registration: repo })(bad).catch((x: unknown) => x)
    expect(e).toBeInstanceOf(ApiError)
    expect((e as ApiError).fields).toEqual({
      givenName: 'required',
      familyName: 'required',
      birthDate: 'invalid',
      mobile: 'invalid',
      email: 'invalid',
      password: 'weak',
      acceptedTerms: 'terms',
    })
    expect(repo.register).toHaveBeenCalledTimes(1)
  })

  it('verifies a 6-digit code and loads the new session; a failing step propagates', async () => {
    const verify = vi.fn(() =>
      Promise.resolve({
        mrn: 'NVG-188240',
        facilityName: 'Northvale General Hospital',
        linked: { visits: 2, labReports: 6, medicines: 3 },
      }),
    )
    const current = vi.fn(() => Promise.resolve(patientSession))
    const run = verifyRegistration({ registration: { verify }, session: { current } })
    await expect(run({ id: 'reg_1' as RegistrationId, code: '12a' })).rejects.toMatchObject({ code: 'invalid_code' })
    await expect(run({ id: 'reg_1' as RegistrationId, code: '481026' })).resolves.toMatchObject({
      value: { session: patientSession },
    })
    verify.mockRejectedValueOnce(new ApiError('x', 'invalid_code', 422))
    await expect(run({ id: 'reg_1' as RegistrationId, code: '000000' })).rejects.toMatchObject({ code: 'invalid_code' })
  })

  it('requests and confirms a reset with the password policy', async () => {
    const session = {
      requestPasswordReset: vi.fn(() => Promise.resolve({ maskedDestination: 'r•••••.pandey@mail.com' })),
      confirmPasswordReset: vi.fn(() => Promise.resolve()),
    }
    await expect(requestPasswordReset({ session })('  ')).rejects.toMatchObject({ code: 'validation_failed' })
    await expect(requestPasswordReset({ session })(' ramesh.pandey@mail.com ')).resolves.toMatchObject({
      value: { maskedDestination: 'r•••••.pandey@mail.com' },
    })
    expect(session.requestPasswordReset).toHaveBeenCalledWith('ramesh.pandey@mail.com')
    await expect(
      confirmPasswordReset({ session })({ token: 't', password: 'kathmandu2026', confirm: 'other' }),
    ).rejects.toMatchObject({ code: 'validation_failed' })
    await expect(
      confirmPasswordReset({ session })({ token: 't', password: 'kathmandu2026', confirm: 'kathmandu2026' }),
    ).resolves.toMatchObject({ value: true })
  })
})

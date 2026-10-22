import type { PackageId, PractitionerId } from '@/core/branded'
import { draftProblems, type ConsultationPackage, type PackageDraft } from '@/domain/packages'
import type { PackageRepository } from '../ports'
import { enrollInPackage, savePackage } from './packages'

const draft: PackageDraft = {
  id: null,
  practitionerId: 'pr_suresh' as PractitionerId,
  name: 'Knee pain programme',
  description: '',
  format: 'hybrid',
  validityDays: 60,
  price: null,
  monthlyCap: 20,
  published: false,
  items: [{ type: 'consultation', quantity: 1, label: '1 consultation' }],
}
const saved = { ...draft, id: 'pkg_1' as PackageId } as unknown as ConsultationPackage

function fakeRepo() {
  const calls: string[] = []
  const repo: Pick<PackageRepository, 'save' | 'publish' | 'enroll'> = {
    save: (d) => {
      calls.push(`save:${String(d.published)}`)
      return Promise.resolve(saved)
    },
    publish: (id) => {
      calls.push(`publish:${id}`)
      return Promise.resolve({ ...saved, published: true })
    },
    enroll: (input) => {
      calls.push(`enroll:${input.chosenFormat}:${input.firstVisit.mode}`)
      return Promise.resolve({
        id: 'enr_1',
        packageId: input.packageId,
        chosenFormat: input.chosenFormat,
        start: input.firstVisit.start,
        expires: input.firstVisit.start,
        firstAppointmentId: 'ap_1',
      })
    },
  }
  return { calls, repo }
}

describe('package use cases', () => {
  it('lists what blocks a draft', () => {
    expect(draftProblems(draft)).toEqual([])
    expect(draftProblems({ ...draft, name: ' ', items: [], monthlyCap: 0 })).toEqual([
      'name-required',
      'items-required',
      'cap-invalid',
    ])
  })

  it('saves a draft unpublished, or saves then publishes', async () => {
    const { calls, repo } = fakeRepo()
    await savePackage({ packages: repo })({ draft, publish: false })
    const published = await savePackage({ packages: repo })({ draft, publish: true })
    expect(published.value.published).toBe(true)
    expect(calls).toEqual(['save:false', 'save:true', 'publish:pkg_1'])
    await expect(
      savePackage({ packages: repo })({ draft: { ...draft, name: '' }, publish: true }),
    ).rejects.toMatchObject({
      code: 'validation_failed',
    })
  })

  it('books the first visit of a hybrid package on-site and rejects formats not offered', async () => {
    const { calls, repo } = fakeRepo()
    const enroll = enrollInPackage({ packages: repo })
    const start = new Date('2026-10-22T03:15:00Z')
    await enroll({ pkg: { id: saved.id, format: 'hybrid' }, chosenFormat: 'hybrid', start })
    await enroll({ pkg: { id: saved.id, format: 'patient_choice' }, chosenFormat: 'remote', start })
    expect(calls).toEqual(['enroll:hybrid:onsite', 'enroll:remote:remote'])
    await expect(
      enroll({ pkg: { id: saved.id, format: 'onsite' }, chosenFormat: 'remote', start }),
    ).rejects.toMatchObject({
      code: 'mode_not_offered',
    })
  })
})

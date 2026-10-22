import type { PackageId, PractitionerId } from '@/core/branded'
import type { ConsultationPackage } from '@/domain/packages'
import type { Practitioner } from '@/domain/scheduling/types'
import { formFromPackage, newPackageForm, presetItem, previewView, toDraft } from './packageForm'

const doctor = {
  id: 'pr_suresh' as PractitionerId,
  displayName: 'Dr. Suresh Bhattarai',
  category: 'Orthopaedics',
} as Practitioner

describe('A3 package form', () => {
  it('starts a new package with one consultation and a monthly cap', () => {
    const f = newPackageForm(doctor.id)
    expect(f).toMatchObject({ id: null, format: 'hybrid', validityDays: 60, cap: '20', published: false })
    expect(f.items).toEqual([{ type: 'consultation', quantity: 1, label: '1 consultation' }])
  })

  it('turns typed price and cap into a draft', () => {
    const f = { ...newPackageForm(doctor.id), name: '  Knee pain programme ', price: '4500', cap: '' }
    expect(toDraft(f)).toMatchObject({
      name: 'Knee pain programme',
      price: { minor: 450000, currency: 'NPR' },
      monthlyCap: null,
    })
    expect(toDraft({ ...f, price: 'abc', cap: '2.5' })).toMatchObject({ price: null, monthlyCap: 2.5 })
  })

  it('round-trips a saved package', () => {
    const pkg = {
      id: 'pkg_1' as PackageId,
      practitionerId: doctor.id,
      name: 'Knee',
      description: 'd',
      format: 'onsite',
      validityDays: 30,
      price: { minor: 150000, currency: 'NPR' },
      monthlyCap: 10,
      published: true,
      items: [presetItem('ecg')],
      practitionerName: doctor.displayName,
      category: doctor.category,
      bookedCount: 0,
    } as ConsultationPackage
    expect(formFromPackage(pkg)).toMatchObject({ price: '1500', cap: '10', published: true })
  })

  it('previews an untitled package with the doctor and the P6 labels', () => {
    const view = previewView({ ...newPackageForm(doctor.id), validityDays: 365, items: [presetItem('messaging')] }, [
      doctor,
    ])
    expect(view).toMatchObject({
      name: 'Untitled package',
      doctor: 'Dr. Suresh Bhattarai',
      category: 'Orthopaedics',
      formatLabel: 'On-site and remote',
      validity: '12 months',
      price: '[PACKAGE PRICE]',
      items: ['Message your care team for 30 days'],
    })
  })
})

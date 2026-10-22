import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { PatientId, PractitionerId } from '@/core/branded'
import { organizationKeys, scopedKeys } from './queryKeys'

describe('scopedKeys', () => {
  it('starts every key with the facility or organization', () => {
    const keys = scopedKeys({ organizationId: 'o1' as OrganizationId, facilityId: 'f1' as FacilityId })
    expect(keys.slots('pr_1' as PractitionerId, 'onsite', '2026-10-21')).toEqual([
      'f',
      'f1',
      'slots',
      'pr_1',
      'onsite',
      '2026-10-21',
    ])
    expect(keys.patientSummary('pt_1' as PatientId)).toEqual(['o', 'o1', 'patients', 'pt_1', 'summary'])
    const values: unknown[] = Object.values(keys)
    const flat = values.flatMap((v): unknown[] =>
      typeof v === 'function' ? [] : Array.isArray(v) ? [v] : Object.values(v as object),
    )
    for (const key of flat) expect(['f', 'o']).toContain((key as unknown[])[0])
    expect(organizationKeys('o1' as OrganizationId).myFacilities[0]).toBe('o')
  })
})

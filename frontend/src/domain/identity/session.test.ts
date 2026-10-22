import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { StaffId } from '@/core/branded'
import { can, initials, membershipFor, needsFacilityChoice, type StaffSession } from './session'

const f1 = 'fac_nvg' as FacilityId
const f2 = 'fac_lks' as FacilityId
const facility = (id: FacilityId) => ({ id, name: id, shortName: id, city: 'Kathmandu', timeZone: 'Asia/Kathmandu' })
const staff = (n: number): StaffSession => ({
  kind: 'staff',
  staffId: 'st_1' as StaffId,
  displayName: 'Dr. Anaya Shrestha',
  title: 'Hospitalist',
  organizationId: 'org_1' as OrganizationId,
  organizationName: 'Northvale Health',
  csrfToken: 't',
  memberships: [f1, f2].slice(0, n).map((id) => ({
    facility: facility(id),
    role: 'Hospitalist',
    departments: [],
    permissions: id === f1 ? ['chart:read'] : [],
  })),
})

describe('identity', () => {
  it('computes initials without the title', () => {
    expect(initials('Dr. Prakash Karki')).toBe('PK')
    expect(initials('Ram Bahadur Thapa')).toBe('RT')
    expect(initials('Sita')).toBe('S')
  })

  it('checks permissions per facility', () => {
    const s = staff(2)
    expect(can(s, f1, 'chart:read')).toBe(true)
    expect(can(s, f2, 'chart:read')).toBe(false)
    expect(can(s, 'fac_x' as FacilityId, 'chart:read')).toBe(false)
    expect(membershipFor(s, f2)?.facility.id).toBe(f2)
  })

  it('asks for a facility unless exactly one membership', () => {
    expect(needsFacilityChoice(staff(1))).toBe(false)
    expect(needsFacilityChoice(staff(2))).toBe(true)
  })
})

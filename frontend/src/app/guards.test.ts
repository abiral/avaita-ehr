import type { PatientId, StaffId } from '@/core/branded'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import type { PatientSession, StaffSession } from '@/domain/identity'
import { requireRole, requireSignedOut, requireStaffFacility, redirectHome } from './guards'
import { createSessionStore } from './session/sessionStore'
import { createTenantSource } from './tenantSource'

const org = 'org_1' as OrganizationId
const fac = 'fac_nvg' as FacilityId
const facility = {
  id: fac,
  name: 'Northvale General Hospital',
  shortName: 'Northvale General',
  city: 'Kathmandu',
  timeZone: 'Asia/Kathmandu',
}
const patient: PatientSession = {
  kind: 'patient',
  patientId: 'pt_1' as PatientId,
  displayName: 'Ramesh Pandey',
  givenName: 'Ramesh',
  mrn: 'NVG-188240',
  organizationId: org,
  organizationName: 'Northvale Health',
  facilities: [facility],
  csrfToken: 'x',
}
const staff: StaffSession = {
  kind: 'staff',
  staffId: 'st_1' as StaffId,
  displayName: 'Dr. Anaya Shrestha',
  title: 'Hospitalist',
  organizationId: org,
  organizationName: 'Northvale Health',
  csrfToken: 'x',
  memberships: [{ facility, role: 'Hospitalist', departments: [], permissions: ['chart:read'] }],
}

const args = (path: string) =>
  ({
    request: new Request(`http://localhost${path}`),
    params: {},
    context: undefined,
    unstable_pattern: '',
    url: new URL(`http://localhost${path}`),
  }) as never

const setup = (session: PatientSession | StaffSession | null, withScope = false) => {
  const sessionStore = createSessionStore()
  const tenant = createTenantSource()
  sessionStore.dispatch({ type: 'loaded', session })
  if (withScope) tenant.set({ organizationId: org, facilityId: fac })
  return { sessionStore, tenant }
}
const location = (r: unknown) => (r instanceof Response ? r.headers.get('Location') : null)

describe('route guards', () => {
  it('sends signed-out users to sign in with returnTo', async () => {
    const deps = setup(null)
    expect(location(await requireRole(deps, 'patient')(args('/portal/book')))).toBe('/login?returnTo=%2Fportal%2Fbook')
    expect(await requireSignedOut(deps)()).toBeNull()
    expect(location(await redirectHome(deps)())).toBe('/login')
  })

  it('keeps patients out of staff routes and signed-in users out of sign in', async () => {
    const deps = setup(patient)
    expect(location(await requireRole(deps, 'staff')(args('/staff')))).toBe('/portal')
    expect(await requireRole(deps, 'patient')(args('/portal'))).toBeNull()
    expect(location(await requireSignedOut(deps)())).toBe('/portal')
  })

  it('sends staff without a facility to the workspace picker', async () => {
    const deps = setup(staff)
    expect(location(await requireStaffFacility(deps)(args('/staff')))).toBe('/staff/workspace')
    expect(location(await redirectHome(deps)())).toBe('/staff/workspace')
  })

  it('checks permissions per facility and answers 403', async () => {
    const deps = setup(staff, true)
    expect(await requireStaffFacility(deps, ['chart:read'])(args('/staff/patients/p1'))).toBeNull()
    await expect(requireStaffFacility(deps, ['org:admin'])(args('/admin/organization'))).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(location(await redirectHome(deps)())).toBe('/staff')
  })
})

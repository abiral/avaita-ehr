import { screen } from '@testing-library/react'
import { renderApp, type AsWho } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

/** Every screen (P1 to P9, C1 to C9, A1 to A4) once loaded, checked with axe. */
const SCREENS: readonly (readonly [id: string, as: AsWho, route: string, heading: RegExp])[] = [
  ['P1', 'signed-out', '/login', /Sign in/],
  ['P2', 'signed-out', '/register', /Create your patient account/],
  ['P3', 'signed-out', '/forgot-password', /Reset your password|Forgot/],
  ['P4', 'patient', '/portal', /Hello, Ramesh/],
  ['P5', 'patient', '/portal/book', /Book an appointment/],
  ['P6', 'patient', '/portal/packages', /Book an appointment/],
  ['P7', 'patient', '/portal/appointments', /My appointments/],
  ['P8', 'patient', '/portal/reports', /Kidney function panel/],
  ['P9', 'patient', '/portal/medicines', /Request a refill/],
  ['C1', 'staff', '/staff/workspace', /Select a workspace/],
  ['C2', 'staff', '/staff', /My patients/],
  ['C3', 'staff', '/staff/patients', /^Patients$/],
  ['C4', 'staff', '/staff/schedule', /Book on behalf of a patient/],
  ['C5', 'staff', '/staff/patients/pt_ram', /Vital signs/],
  ['C6', 'staff', '/staff/patients/pt_ram/notes', /Insert from chart/],
  ['C7', 'staff', '/staff/patients/pt_ram/orders', /Order basket/],
  ['C8', 'staff', '/staff/results', /Renal function panel/],
  ['C9', 'staff', '/staff/medication-requests', /Losartan 50 mg tablet/],
  ['A1', 'admin', '/admin/availability', /weekly template/],
  ['A2', 'admin', '/admin/time-off', /October 2026/],
  ['A3', 'admin', '/admin/packages', /Edit package/],
  ['A4', 'admin', '/admin/organization', /Roles by facility/],
]

describe('accessibility of every screen', () => {
  it.each(SCREENS)('%s (%s at %s) has no axe violations', async (_id, as, route, heading) => {
    const { container } = renderApp({ as, route, withFacility: route !== '/staff/workspace' })
    expect(await screen.findByRole('heading', { name: heading }, { timeout: 4000 })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

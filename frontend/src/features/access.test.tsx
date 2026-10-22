import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('P1 sign in', () => {
  it('signs a patient in and lands on the portal (or the safe returnTo)', async () => {
    const { user, router, container } = renderApp({ route: '/login?returnTo=%2Fportal%2Freports' })
    await screen.findByRole('heading', { name: 'Sign in to Northvale Health' })
    await expectNoA11yViolations(container)
    await user.type(screen.getByLabelText('Email or mobile number'), 'ramesh.pandey@mail.com')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/portal/reports'))
  })

  it('shows field errors, then a credentials error without color alone', async () => {
    const { user } = renderApp({ route: '/login' })
    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Email or mobile number')).toHaveAccessibleDescription(
      'Enter your email or mobile number.',
    )
    await user.type(screen.getByLabelText('Email or mobile number'), 'nobody@mail.com')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is not correct.')
  })

  it('sends staff with several facilities to the workspace picker, and shows SSO for staff only', async () => {
    const { user, router } = renderApp({ route: '/login' })
    expect(await screen.findByRole('link', { name: 'Create an account' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hospital staff' }))
    expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue with hospital SSO' }))
    expect(screen.getByText(/Single sign-on is not set up/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Work email'), 'anaya.shrestha@northvale.health')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/workspace'))
  })

  it('sends staff with one facility straight to the workspace', async () => {
    const { user, router } = renderApp({ route: '/login' })
    await user.click(await screen.findByRole('button', { name: 'Hospital staff' }))
    await user.type(screen.getByLabelText('Work email'), 'sarita.joshi@northvale.health')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff'))
  })
})

describe('P2 registration', () => {
  it('validates, verifies the code and links existing records', async () => {
    const { user, router, container, services } = renderApp({ route: '/register' })
    await screen.findByRole('heading', { name: 'Create your patient account' })
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByLabelText('First name')).toHaveAccessibleDescription('This field is required.')
    expect(screen.getByText('Please accept the terms to continue.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('First name'), 'Ramesh')
    await user.type(screen.getByLabelText('Last name'), 'Pandey')
    await user.type(screen.getByLabelText('Date of birth'), '1965-03-12')
    await user.type(screen.getByLabelText('Mobile number'), '+977 9841234567')
    await user.type(screen.getByLabelText('Email'), 'ramesh.new@mail.com')
    await user.type(screen.getByLabelText('Password'), 'kathmandu2026')
    await user.type(screen.getByLabelText('Hospital number (optional)'), 'NVG-188240')
    await user.click(screen.getByRole('checkbox'))
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Verify your mobile' })).toBeInTheDocument()
    expect(screen.getByText(/Enter the 6-digit code sent to \+977 98XX XXX XXX/)).toBeInTheDocument()
    await user.click(screen.getByLabelText('Digit 1'))
    await user.paste('481026')
    await user.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('heading', { name: 'Your account is ready' })).toBeInTheDocument()
    expect(screen.getByText('NVG-188240')).toBeInTheDocument()
    expect(screen.getByText('2 visits, 6 lab reports, 3 medicines')).toBeInTheDocument()
    expect(services.sessionStore.get().status).toBe('active')
    await user.click(screen.getByRole('link', { name: 'Go to my health' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/portal'))
  })

  it('reports a wrong code', async () => {
    const { user } = renderApp({ route: '/register' })
    await screen.findByRole('heading', { name: 'Create your patient account' })
    for (const [label, value] of [
      ['First name', 'Asha'],
      ['Last name', 'Rai'],
      ['Date of birth', '1990-01-02'],
      ['Mobile number', '9812345678'],
      ['Email', 'asha@mail.com'],
      ['Password', 'pokhara2026'],
    ]) {
      await user.type(screen.getByLabelText(label!), value!)
    }
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Verify your mobile' })
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled()
    await user.click(screen.getByLabelText('Digit 1'))
    await user.paste('000000')
    await user.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not correct.')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Create your patient account' })).toBeInTheDocument()
  })
})

describe('P3 password reset', () => {
  it('requests a link, shows the masked address and sets a password with live rules', async () => {
    const { user, router, container } = renderApp({ route: '/forgot-password' })
    await user.type(await screen.findByLabelText('Email or mobile number'), 'ramesh.pandey@mail.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByText('r•••••.pandey@mail.com')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'I have the link, set a new password' }))
    const rules = screen.getByRole('list', { name: 'Password rules' })
    expect(within(rules).getByText(/At least 10 characters/)).toHaveTextContent('not met yet')
    await user.type(screen.getByLabelText('New password'), 'kathmandu2026')
    await user.type(screen.getByLabelText('Confirm new password'), 'kathmandu2026')
    expect(within(rules).getAllByText(/, met/)).toHaveLength(3)
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Update password and sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(await screen.findByText('Your password was updated. Sign in with the new password.')).toBeInTheDocument()
  })
})

describe('C1 workspace', () => {
  it('lists facilities with the onboarding one disabled and opens the chosen department', async () => {
    const { user, router, services, container } = renderApp({
      as: 'staff',
      route: '/staff/workspace',
      withFacility: false,
    })
    expect(await screen.findByRole('button', { name: /Northvale General Hospital/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Lakeview Hospital/ })).toBeDisabled()
    expect(
      screen.getByText('You have access to 2 facilities in Northvale Health. Switch at any time from the sidebar.'),
    ).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Internal Medicine · Ward 4C' }))
    await user.click(screen.getByRole('button', { name: 'Open workspace' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff'))
    expect(services.tenant.snapshot()).toMatchObject({ scope: { facilityId: 'fac_nvg' }, departmentId: 'dep_im4c' })
    expect(await screen.findByText('Internal Medicine · 4C')).toBeInTheDocument()
  })
})

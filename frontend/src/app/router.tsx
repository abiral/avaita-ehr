import { createBrowserRouter, type RouteObject } from 'react-router'
import { t } from '@/i18n'
import { redirectHome, requireRole, requireSignedOut, requireStaffFacility, type GuardDeps } from './guards'
import { RootLayout } from './RootLayout'
import { paths } from './routes'
import { Placeholder } from './screens/Placeholder'
import { NotFound, RouteError } from './screens/RouteError'
import { AdminShell } from './shells/AdminShell'
import { AuthShell } from './shells/AuthShell'
import { PortalShell } from './shells/PortalShell'
import { StaffShellRoute } from './shells/StaffShellRoute'

const placeholder = (title: string, area: 'portal' | 'staff') =>
  function PlaceholderScreen() {
    return <Placeholder title={title} area={area} />
  }

const authRoutes = (deps: GuardDeps): RouteObject => ({
  Component: AuthShell,
  loader: requireSignedOut(deps),
  children: [
    { path: paths.login, Component: placeholder('Sign in', 'portal') },
    { path: paths.register, Component: placeholder('Create an account', 'portal') },
    { path: paths.forgotPassword, Component: placeholder('Reset password', 'portal') },
  ],
})

const portalRoutes = (deps: GuardDeps): RouteObject => ({
  path: paths.portal.home,
  Component: PortalShell,
  loader: requireRole(deps, 'patient'),
  ErrorBoundary: RouteError,
  children: [
    { index: true, Component: placeholder(t('shell.portal.home'), 'portal') },
    { path: 'book', Component: placeholder('Book an appointment', 'portal') },
    { path: 'packages', Component: placeholder('Consultation packages', 'portal') },
    { path: 'appointments', Component: placeholder(t('shell.portal.appointments'), 'portal') },
    { path: 'reports', Component: placeholder(t('shell.portal.reports'), 'portal') },
    { path: 'medicines', Component: placeholder(t('shell.portal.medicines'), 'portal') },
  ],
})

const staffRoutes = (deps: GuardDeps): RouteObject[] => [
  {
    path: paths.staff.workspace,
    loader: requireRole(deps, 'staff'),
    Component: placeholder('Select a workspace', 'staff'),
  },
  {
    path: paths.staff.today,
    Component: StaffShellRoute,
    loader: requireStaffFacility(deps),
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: placeholder(t('shell.staff.today'), 'staff') },
      { path: 'patients', Component: placeholder(t('shell.staff.patients'), 'staff') },
      { path: 'schedule', Component: placeholder(t('shell.staff.schedule'), 'staff') },
      { path: 'results', Component: placeholder(t('shell.staff.results'), 'staff') },
      { path: 'medication-requests', Component: placeholder(t('shell.staff.medicationRequests'), 'staff') },
    ],
  },
]

const adminRoutes = (deps: GuardDeps): RouteObject => ({
  path: '/admin',
  Component: AdminShell,
  loader: requireStaffFacility(deps, ['schedule:admin', 'package:admin', 'org:admin']),
  ErrorBoundary: RouteError,
  children: [
    {
      path: 'availability',
      loader: requireStaffFacility(deps, ['schedule:admin']),
      Component: placeholder(t('shell.admin.blocks'), 'staff'),
    },
    {
      path: 'time-off',
      loader: requireStaffFacility(deps, ['schedule:admin']),
      Component: placeholder(t('shell.admin.timeOff'), 'staff'),
    },
    {
      path: 'packages',
      loader: requireStaffFacility(deps, ['package:admin']),
      Component: placeholder(t('shell.admin.packages'), 'staff'),
    },
    {
      path: 'organization',
      loader: requireStaffFacility(deps, ['org:admin']),
      Component: placeholder(t('shell.admin.facilities'), 'staff'),
    },
  ],
})

export function buildRoutes(deps: GuardDeps): RouteObject[] {
  return [
    {
      Component: RootLayout,
      ErrorBoundary: RouteError,
      children: [
        { index: true, loader: redirectHome(deps) },
        authRoutes(deps),
        portalRoutes(deps),
        ...staffRoutes(deps),
        adminRoutes(deps),
        { path: '*', Component: NotFound },
      ],
    },
  ]
}

export const createAppRouter = (deps: GuardDeps) => createBrowserRouter(buildRoutes(deps))

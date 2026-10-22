import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { redirectHome, requireRole, requireSignedOut, requireStaffFacility, type GuardDeps } from './guards'
import { ChartLayout } from './chart/ChartLayout'
import { RootLayout } from './RootLayout'
import { paths } from './routes'
import { NotFound, RouteError } from './screens/RouteError'
import { AdminShell } from './shells/AdminShell'
import { AuthShell } from './shells/AuthShell'
import { PortalShell } from './shells/PortalShell'
import { StaffShellRoute } from './shells/StaffShellRoute'

/** Lazy-loads a screen so each area ships in its own chunk. */
const screen = (load: () => Promise<ComponentType>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: await load() }),
})

const authRoutes = (deps: GuardDeps): RouteObject => ({
  Component: AuthShell,
  loader: requireSignedOut(deps),
  children: [
    { path: paths.login, ...screen(async () => (await import('@/features/auth')).SignInScreen) },
    { path: paths.register, ...screen(async () => (await import('@/features/registration')).RegistrationScreen) },
    {
      path: paths.forgotPassword,
      ...screen(async () => (await import('@/features/password-reset')).PasswordResetScreen),
    },
  ],
})

const portalRoutes = (deps: GuardDeps): RouteObject => ({
  path: paths.portal.home,
  Component: PortalShell,
  loader: requireRole(deps, 'patient'),
  ErrorBoundary: RouteError,
  children: [
    { index: true, ...screen(async () => (await import('@/features/portal-home')).HomeScreen) },
    { path: 'book', ...screen(async () => (await import('@/features/booking')).BookingScreen) },
    { path: 'packages', ...screen(async () => (await import('@/features/patient-packages')).PackagesScreen) },
    { path: 'appointments', ...screen(async () => (await import('@/features/my-appointments')).MyAppointmentsScreen) },
    { path: 'reports', ...screen(async () => (await import('@/features/patient-reports')).ReportsScreen) },
    { path: 'medicines', ...screen(async () => (await import('@/features/patient-medicines')).MedicinesScreen) },
  ],
})

const notes = screen(async () => (await import('@/features/clinical-notes')).NotesScreen)
const orders = screen(async () => (await import('@/features/lab-orders')).OrdersScreen)
const chartResults = screen(async () => (await import('@/features/results-review')).ChartResultsScreen)

/** C5 to C8 share the chart layout route, which renders the patient banner. */
const chartRoutes = (): RouteObject => ({
  path: 'patients/:patientId',
  Component: ChartLayout,
  children: [
    { index: true, ...screen(async () => (await import('@/features/patient-chart')).ChartSummaryScreen) },
    { path: 'notes', ...notes },
    { path: 'notes/new', ...notes },
    { path: 'orders', ...orders },
    { path: 'orders/new', ...orders },
    { path: 'results', ...chartResults },
    { path: 'results/:resultId', ...chartResults },
    { path: 'medications', ...screen(async () => (await import('@/features/patient-chart')).ChartMedicationsScreen) },
  ],
})

const staffRoutes = (deps: GuardDeps): RouteObject[] => [
  {
    path: paths.staff.workspace,
    loader: requireRole(deps, 'staff'),
    ...screen(async () => (await import('@/features/workspace')).WorkspaceScreen),
  },
  {
    path: paths.staff.today,
    Component: StaffShellRoute,
    loader: requireStaffFacility(deps),
    ErrorBoundary: RouteError,
    children: [
      { index: true, ...screen(async () => (await import('@/features/ward')).TodayScreen) },
      { path: 'patients', ...screen(async () => (await import('@/features/ward')).PatientsScreen) },
      { path: 'schedule', ...screen(async () => (await import('@/features/clinic-schedule')).ScheduleScreen) },
      { path: 'results', ...screen(async () => (await import('@/features/results-review')).ResultsInboxScreen) },
      {
        path: 'results/:resultId',
        ...screen(async () => (await import('@/features/results-review')).ResultsInboxScreen),
      },
      chartRoutes(),
      {
        path: 'medication-requests',
        ...screen(async () => (await import('@/features/medication-requests')).RequestsScreen),
      },
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
      ...screen(async () => (await import('@/features/admin-availability')).AvailabilityScreen),
    },
    {
      path: 'time-off',
      loader: requireStaffFacility(deps, ['schedule:admin']),
      ...screen(async () => (await import('@/features/admin-time-off')).TimeOffScreen),
    },
    {
      path: 'packages',
      loader: requireStaffFacility(deps, ['package:admin']),
      ...screen(async () => (await import('@/features/admin-packages')).AdminPackagesScreen),
    },
    {
      path: 'organization',
      loader: requireStaffFacility(deps, ['org:admin']),
      ...screen(async () => (await import('@/features/organization')).OrganizationScreen),
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

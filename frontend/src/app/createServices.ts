import { createUseCases } from '@/application/usecases'
import { systemClock } from '@/core/clock'
import { createEmitter } from '@/core/events'
import { createAppointmentRepository } from '@/infrastructure/api/appointments/repository'
import { createClinicalRepository } from '@/infrastructure/api/clinical/repository'
import { createLabRepository } from '@/infrastructure/api/labs/repository'
import { createMedicationRepository } from '@/infrastructure/api/medications/repository'
import { createPackageRepository } from '@/infrastructure/api/packages/repository'
import { createPractitionerRepository } from '@/infrastructure/api/practitioners/repository'
import { createRegistrationRepository } from '@/infrastructure/api/registration/repository'
import { createSchedulingRepository } from '@/infrastructure/api/scheduling/repository'
import { createSessionRepository } from '@/infrastructure/api/session/repository'
import { createTenancyRepository } from '@/infrastructure/api/tenancy/repository'
import { createConsoleLogger } from '@/infrastructure/browser/logger'
import { createDomIdleDetector } from '@/infrastructure/browser/idleDetector'
import {
  createHttpClient,
  csrf,
  fetchTerminal,
  problemJson,
  requestId,
  sessionGuard,
  tenantHeaders,
  timeout,
  type HttpClient,
} from '@/infrastructure/http'
import { createBrowserPrinter } from '@/infrastructure/print/browserPrinter'
import { createSseChannel } from '@/infrastructure/realtime/sseChannel'
import { createPreferenceStore } from '@/infrastructure/storage/preferenceStore'
import { formatDate, formatTime, t } from '@/i18n'
import { createDraftStore } from './drafts'
import { createQueryClient } from './queryClient'
import type { AppEvents, Repositories, Services } from './services'
import { createSessionStore } from './session/sessionStore'
import { wireTenant } from './tenancy'
import { createTenantSource } from './tenantSource'

export interface AppConfig {
  readonly apiBase: string
  readonly dev: boolean
}

export type ServiceOverrides = Partial<Omit<Services, 'repos' | 'useCases'>> & {
  readonly repos?: Partial<Repositories>
}

const createRepositories = (http: HttpClient): Repositories => ({
  session: createSessionRepository(http),
  registration: createRegistrationRepository(http),
  tenancy: createTenancyRepository(http),
  practitioners: createPractitionerRepository(http),
  scheduling: createSchedulingRepository(http),
  appointments: createAppointmentRepository(http),
  packages: createPackageRepository(http),
  clinical: createClinicalRepository(http),
  labs: createLabRepository(http),
  medications: createMedicationRepository(http),
})

/** Composition root: the only place that creates adapters. Overrides replace any part (tests). */
export function createServices(config: AppConfig, overrides: ServiceOverrides = {}): Services {
  const { repos: repoOverrides, ...rest } = overrides
  const clock = rest.clock ?? systemClock
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const base = {
    clock,
    events: createEmitter<AppEvents>(),
    sessionStore: createSessionStore(),
    tenant: createTenantSource(),
    logger: createConsoleLogger(config.dev),
    prefs: createPreferenceStore(window.localStorage),
    printer: createBrowserPrinter(clock, (doc, at) => {
      const params = {
        patient: doc.patientName,
        mrn: doc.mrn,
        by: doc.printedBy,
        at: `${formatDate(at, zone)} ${formatTime(at, zone)}`,
      }
      return doc.mrn ? t('common.print.footer', params) : t('common.print.footerNoPatient', params)
    }),
    realtime: createSseChannel({ url: `${config.apiBase}/events` }),
    idle: createDomIdleDetector(window),
    drafts: createDraftStore(),
    queryClient: createQueryClient(),
    ...rest,
  }
  const http = createHttpClient(
    [
      sessionGuard(base.events),
      tenantHeaders(base.tenant),
      csrf({ current: base.sessionStore.csrfToken }),
      requestId(),
      timeout(15_000),
      problemJson(),
    ],
    fetchTerminal(config.apiBase),
  )
  wireTenant(base.sessionStore, base.tenant, base.prefs)
  const repos = { ...createRepositories(http), ...repoOverrides }
  return { ...base, repos, useCases: createUseCases({ clock: base.clock, repos }) }
}

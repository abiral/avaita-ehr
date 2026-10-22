import { systemClock } from '@/core/clock'
import { createEmitter } from '@/core/events'
import { createSessionRepository } from '@/infrastructure/api/session/repository'
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
import { formatDate, formatTime } from '@/i18n'
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

export type ServiceOverrides = Partial<Omit<Services, 'repos'>> & { readonly repos?: Partial<Repositories> }

const createRepositories = (http: HttpClient): Repositories => ({
  session: createSessionRepository(http),
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
    printer: createBrowserPrinter(clock, (d) => `${formatDate(d, zone)} ${formatTime(d, zone)}`),
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
  return { ...base, repos: { ...createRepositories(http), ...repoOverrides } }
}

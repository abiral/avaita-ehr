import type { FacilityId, OrganizationId } from '@/core/tenant'
import { createPreferenceStore, createMemoryPreferenceStore } from './storage/preferenceStore'
import { createSseChannel } from './realtime/sseChannel'
import { createDomIdleDetector } from './browser/idleDetector'
import { createBrowserPrinter } from './print/browserPrinter'
import { createConsoleLogger } from './browser/logger'

class FakeEventSource {
  static all: FakeEventSource[] = []
  listeners = new Map<string, (ev: MessageEvent<string>) => void>()
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  closed = false
  constructor(readonly url: string) {
    FakeEventSource.all.push(this)
  }
  addEventListener(name: string, fn: (ev: MessageEvent<string>) => void) {
    this.listeners.set(name, fn)
  }
  close() {
    this.closed = true
  }
  fire(name: string, data: string) {
    this.listeners.get(name)?.({ data } as MessageEvent<string>)
  }
}

const scope = (f: string) => ({ organizationId: 'o' as OrganizationId, facilityId: f as FacilityId })

describe('preference store', () => {
  it('stores only prefixed UI preferences and survives bad JSON', () => {
    const store = createPreferenceStore(window.localStorage)
    store.set('lastFacilityId', 'fac_1')
    expect(store.get('lastFacilityId')).toBe('fac_1')
    expect(window.localStorage.getItem('folio.pref.lastFacilityId')).toBe('"fac_1"')
    window.localStorage.setItem('folio.pref.sidebarCollapsed', '{bad')
    expect(store.get('sidebarCollapsed')).toBeUndefined()
    store.remove('lastFacilityId')
    expect(store.get('lastFacilityId')).toBeUndefined()
    const none = createPreferenceStore(undefined)
    none.set('sidebarCollapsed', true)
    expect(none.get('sidebarCollapsed')).toBeUndefined()
  })

  it('has an in-memory variant for tests', () => {
    const store = createMemoryPreferenceStore()
    store.set('sidebarCollapsed', true)
    expect(store.get('sidebarCollapsed')).toBe(true)
    store.remove('sidebarCollapsed')
    expect(store.get('sidebarCollapsed')).toBeUndefined()
  })
})

describe('sse channel', () => {
  beforeEach(() => {
    FakeEventSource.all = []
  })

  it('dispatches events, reconnects with backoff and closes', () => {
    const delays: number[] = []
    const pending: (() => void)[] = []
    const channel = createSseChannel({
      url: '/api/events',
      create: (url) => new FakeEventSource(url) as unknown as EventSource,
      schedule: (fn, ms) => {
        delays.push(ms)
        pending.push(fn)
      },
    })
    const seen: string[] = []
    const off = channel.subscribe('result.critical', (p) => seen.push(p.resultId))
    channel.connect(scope('f1'))
    const first = FakeEventSource.all[0]!
    expect(first.url).toBe('/api/events?facility=f1')
    first.fire('result.critical', '{"resultId":"r1"}')
    first.fire('result.critical', 'not json')
    first.onerror?.()
    pending.shift()?.()
    FakeEventSource.all[1]!.onerror?.()
    expect(delays).toEqual([1000, 2000])
    pending.shift()?.()
    FakeEventSource.all[2]!.onopen?.()
    channel.connect(scope('f2'))
    expect(FakeEventSource.all[2]!.closed).toBe(true)
    expect(FakeEventSource.all[3]!.url).toBe('/api/events?facility=f2')
    off()
    FakeEventSource.all[3]!.fire('result.critical', '{"resultId":"r2"}')
    expect(seen).toEqual(['r1'])
    channel.close()
    expect(FakeEventSource.all[3]!.closed).toBe(true)
  })
})

describe('browser adapters', () => {
  it('reports activity until stopped', () => {
    const fn = vi.fn()
    const stop = createDomIdleDetector(window).onActivity(fn)
    window.dispatchEvent(new KeyboardEvent('keydown'))
    stop()
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('prints with the PHI footer and clears the print root', () => {
    document.body.innerHTML = '<div id="print-root"></div>'
    const footers: string[] = []
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      footers.push(document.querySelector('.print-footer')?.textContent ?? '')
    })
    createBrowserPrinter(
      { now: () => new Date('2026-10-21T04:35:00Z') },
      (doc, at) => `${doc.patientName} · MRN ${doc.mrn} · Printed by ${doc.printedBy} · ${at.toISOString()}`,
    ).print({
      title: 'Lab report',
      patientName: 'Ram Bahadur Thapa',
      mrn: 'NVG-204118',
      printedBy: 'Dr. Anaya Shrestha',
      sections: [{ heading: 'Potassium', lines: ['6.1 mmol/L'] }],
    })
    expect(footers[0]).toBe(
      'Ram Bahadur Thapa · MRN NVG-204118 · Printed by Dr. Anaya Shrestha · 2026-10-21T04:35:00.000Z',
    )
    expect(document.getElementById('print-root')?.childElementCount).toBe(0)
    print.mockRestore()
  })

  it('logs redacted data only when enabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createConsoleLogger(true).warn('x', { patientName: 'a' })
    createConsoleLogger(true).error('y')
    createConsoleLogger(false).warn('z')
    expect(warn).toHaveBeenCalledWith('x', { patientName: '[redacted]' })
    expect(error).toHaveBeenCalledTimes(1)
    warn.mockRestore()
    error.mockRestore()
  })
})

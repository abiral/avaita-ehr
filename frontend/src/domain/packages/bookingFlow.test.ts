import type { PackageId } from '@/core/branded'
import {
  initialPackageBooking,
  packageBookingFlow,
  type PackageBookingEvent,
  type PackageBookingState,
} from './bookingFlow'

const pkgId = 'pkg_kidney' as PackageId
const at = new Date('2026-10-22T03:15:00Z')
const run = (events: readonly PackageBookingEvent[], from = initialPackageBooking): PackageBookingState =>
  events.reduce(packageBookingFlow, from)

describe('packageBookingFlow', () => {
  const opened = run([{ type: 'open', pkg: { id: pkgId, format: 'hybrid' } }])
  const chosen = run([{ type: 'pick-slot', start: at }], opened)
  const submitting = run([{ type: 'submit' }], chosen)

  it.each<[string, PackageBookingState, PackageBookingEvent, Partial<PackageBookingState>]>([
    [
      'open preselects the only format',
      initialPackageBooking,
      { type: 'open', pkg: { id: pkgId, format: 'hybrid' } },
      { step: 'detail', format: 'hybrid' },
    ],
    [
      'open patient choice starts on-site',
      initialPackageBooking,
      { type: 'open', pkg: { id: pkgId, format: 'patient_choice' } },
      { step: 'detail', format: 'onsite' },
    ],
    [
      'picking a format clears the slot',
      chosen,
      { type: 'pick-format', format: 'remote' },
      { step: 'format', format: 'remote', start: null },
    ],
    ['picking a slot', opened, { type: 'pick-slot', start: at }, { step: 'first-visit', start: at }],
    ['submit needs a slot', opened, { type: 'submit' }, { step: 'detail' }],
    ['submit with a slot', chosen, { type: 'submit' }, { step: 'submitting' }],
    ['booked', submitting, { type: 'booked', enrollmentId: 'enr_1' }, { step: 'booked', enrollmentId: 'enr_1' }],
    [
      'failed clears the slot',
      submitting,
      { type: 'failed', error: 'Taken' },
      { step: 'failed', start: null, error: 'Taken' },
    ],
    ['cannot close while submitting', submitting, { type: 'close' }, { step: 'submitting' }],
    ['close goes back to browse', chosen, { type: 'close' }, initialPackageBooking],
    ['booked ignored outside submitting', chosen, { type: 'booked', enrollmentId: 'x' }, { step: 'first-visit' }],
    [
      'slots ignored on browse',
      initialPackageBooking,
      { type: 'pick-slot', start: at },
      { step: 'browse', start: null },
    ],
  ])('%s', (_name, from, event, expected) => {
    expect(packageBookingFlow(from, event)).toMatchObject(expected)
  })

  it('recovers from a failure by picking another slot', () => {
    const failed = run([{ type: 'failed', error: 'Taken' }], submitting)
    expect(run([{ type: 'pick-slot', start: at }, { type: 'submit' }], failed).step).toBe('submitting')
  })
})

import type { ReactElement } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useTenant } from '@/app/TenantProvider'
import type { Practitioner } from '@/domain/scheduling/types'
import { localDateOf } from '@/domain/time'
import { t } from '@/i18n'
import { slotsOnDay } from '../model/days'
import { leaveNote } from '../model/leaveNote'
import { whenText } from '../model/summary'
import type { useBookingFlow } from '../model/useBookingFlow'
import { visitModes } from '../model/visitModes'
import { BookedStep } from './BookedStep'
import { ConfirmStep } from './ConfirmStep'
import { ModeStep } from './ModeStep'
import { SearchStep } from './SearchStep'
import { SlotStep } from './SlotStep'

type Flow = ReturnType<typeof useBookingFlow>
interface StepProps {
  readonly flow: Flow
  readonly doctor: Practitioner
  readonly tz: string
}

const VISIT_MINUTES = 20

function Search({ flow, tz }: { readonly flow: Flow; readonly tz: string }) {
  const { clock } = useServices()
  const { search } = flow
  const dateOf = (d: Date) => localDateOf(d, tz)
  return (
    <SearchStep
      q={search.q}
      category={search.category}
      counts={search.counts}
      doctors={search.doctors}
      loading={search.loading}
      today={dateOf(clock.now())}
      timeZone={tz}
      dateOf={dateOf}
      actions={{ ...search, select: flow.pickDoctor }}
    />
  )
}

function Slot({ flow, doctor, tz }: StepProps) {
  const { state, picker, dispatch } = flow
  const remote = state.mode === 'remote'
  const key = remote ? 'portal.booking.slotHintRemote' : 'portal.booking.slotHintOnsite'
  const hint = `${t(key, { doctor: doctor.displayName })}${leaveNote(picker.timeOff, tz)}`
  return (
    <SlotStep
      hint={hint}
      days={picker.days}
      day={state.day}
      slots={state.day ? slotsOnDay(picker.slots, state.day, tz) : []}
      start={state.start}
      remote={remote}
      timeZone={tz}
      error={state.error}
      onDay={(day) => dispatch({ type: 'pick-day', day })}
      onSlot={(start) => dispatch({ type: 'pick-slot', start })}
    />
  )
}

function Done({ flow, doctor, tz }: StepProps) {
  const { clock } = useServices()
  const { state } = flow
  const start = state.start ?? clock.now()
  const mode = visitModes[state.mode ?? 'onsite']
  const text = t('portal.booking.bookedBody', {
    mode: mode.name(),
    doctor: doctor.displayName,
    when: whenText(start, tz),
  })
  return (
    <BookedStep
      rescheduled={flow.rescheduling}
      reference={state.appointmentId ?? ''}
      text={text}
      event={{
        start,
        end: new Date(start.getTime() + VISIT_MINUTES * 60_000),
        title: `${mode.name()}: ${doctor.displayName}`,
        location: doctor.location,
      }}
    />
  )
}

function Mode({ flow, doctor }: StepProps) {
  const tenant = useTenant()
  return (
    <ModeStep
      doctor={doctor}
      facility={tenant.facility?.name ?? ''}
      mode={flow.state.mode}
      onPick={(mode) => flow.dispatch({ type: 'pick-mode', mode })}
    />
  )
}

function Confirm({ flow }: StepProps) {
  return (
    <ConfirmStep
      reason={flow.reason}
      remote={flow.state.mode === 'remote'}
      cutoffHours={(flow.picker.rules?.cancelCutoffMinutes ?? 240) / 60}
      onReason={flow.setReason}
    />
  )
}

const BODIES: Record<Exclude<Flow['state']['step'], 'search'>, (p: StepProps) => ReactElement> = {
  mode: Mode,
  slot: Slot,
  failed: Slot,
  confirm: Confirm,
  submitting: Confirm,
  booked: Done,
}

/** Renders the step the booking machine is in. */
export function StepBody({ flow }: { readonly flow: Flow }) {
  const { timeZone } = useTenant()
  const { state, doctor } = flow
  if (state.step === 'search' || !doctor) return <Search flow={flow} tz={timeZone} />
  const Body = BODIES[state.step]
  return <Body flow={flow} doctor={doctor} tz={timeZone} />
}

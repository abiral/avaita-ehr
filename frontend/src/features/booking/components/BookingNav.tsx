import { t } from '@/i18n'
import { Button } from '@/ui'
import styles from '../Booking.module.css'
import type { useBookingFlow } from '../model/useBookingFlow'

type Flow = ReturnType<typeof useBookingFlow>
type State = Flow['state']

const SHOWN = new Set(['mode', 'slot', 'confirm', 'submitting', 'failed'])

const isConfirming = (s: State): boolean => s.step === 'confirm' || s.step === 'submitting'

function canContinue(s: State): boolean {
  if (s.step === 'mode') return s.mode !== null
  if (s.step === 'slot') return s.start !== null
  return isConfirming(s)
}

function primaryLabel(s: State, rescheduling: boolean): string {
  if (s.step === 'submitting') return t('portal.booking.booking')
  if (!isConfirming(s)) return t('portal.booking.continue')
  return rescheduling ? t('portal.booking.confirmReschedule') : t('portal.booking.confirm')
}

/** Back and Continue (or Confirm booking) under steps 2 to 4. */
export function BookingNav({ flow }: { readonly flow: Flow }) {
  const { state, dispatch } = flow
  if (!SHOWN.has(state.step)) return null
  const confirming = isConfirming(state)
  const atStart = flow.rescheduling && (state.step === 'slot' || state.step === 'failed')
  return (
    <div className={styles.nav}>
      {atStart ? <span /> : <Button onClick={() => dispatch({ type: 'back' })}>{t('portal.booking.backStep')}</Button>}
      <Button
        variant="primary"
        disabled={!canContinue(state) || state.step === 'submitting'}
        onClick={confirming ? flow.submit : () => dispatch({ type: 'next' })}
      >
        {primaryLabel(state, flow.rescheduling)}
      </Button>
    </div>
  )
}

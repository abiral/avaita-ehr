import { act } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expectNoA11yViolations } from '@/test/a11y'
import { Calendar } from './Calendar'
import { Combobox } from './Combobox'
import { ConfirmProvider, useConfirm } from './ConfirmDialog'
import { Modal } from './Modal'
import { ToastProvider, useToast } from './Toast'

describe('Modal', () => {
  it('traps focus, closes on Escape and returns focus', async () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true)
            }}
          >
            Open
          </button>
          {open ? (
            <Modal
              title="Cancel appointment"
              description="Tue 3 Nov"
              closeLabel="Close"
              onClose={() => {
                setOpen(false)
              }}
              footer={<button type="button">Last</button>}
            >
              <input aria-label="Reason" />
            </Modal>
          ) : null}
        </>
      )
    }
    render(<Demo />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Cancel appointment' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Tue 3 Nov')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await expectNoA11yViolations(document.body)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})

describe('useConfirm', () => {
  it('resolves true on confirm and false on cancel', async () => {
    const results: boolean[] = []
    function Demo() {
      const confirm = useConfirm()
      return (
        <button
          type="button"
          onClick={() => {
            void confirm({
              title: 'Approve with a fired check?',
              confirmLabel: 'Approve anyway',
              cancelLabel: 'Go back',
              tone: 'danger',
            }).then((ok) => {
              results.push(ok)
            })
          }}
        >
          Approve
        </button>
      )
    }
    render(
      <ConfirmProvider>
        <Demo />
      </ConfirmProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve anyway' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Approve anyway' }))
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await userEvent.click(screen.getAllByRole('button', { name: 'Go back' })[0]!)
    await waitFor(() => {
      expect(results).toEqual([true, false])
    })
  })

  it('throws without a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Bad() {
      useConfirm()
      return null
    }
    expect(() => render(<Bad />)).toThrow('useConfirm needs ConfirmProvider')
    spy.mockRestore()
  })
})

describe('Toast', () => {
  it('shows a status message with an action and dismisses', async () => {
    const onUndo = vi.fn()
    function Demo() {
      const toast = useToast()
      return (
        <button
          type="button"
          onClick={() => {
            toast.show({ message: 'Appointment cancelled', action: { label: 'Undo', onAction: onUndo } })
          }}
        >
          Go
        </button>
      )
    }
    const { container } = render(
      <ToastProvider dismissLabel="Dismiss">
        <Demo />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(screen.getByRole('status')).toHaveTextContent('Appointment cancelled')
    await expectNoA11yViolations(container)
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('auto-dismisses after its duration', () => {
    vi.useFakeTimers()
    let api: ReturnType<typeof useToast> | null = null
    function Grab() {
      api = useToast()
      return null
    }
    render(
      <ToastProvider dismissLabel="Dismiss">
        <Grab />
      </ToastProvider>,
    )
    act(() => {
      api?.show({ message: 'Saved', durationMs: 100 })
    })
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    vi.useRealTimers()
  })
})

describe('Combobox', () => {
  it('filters with the keyboard and selects', async () => {
    const onSelect = vi.fn()
    function Demo() {
      const [q, setQ] = useState('')
      const all = [
        { id: 'p1', label: 'Ram Bahadur Thapa', meta: 'NVG-204118' },
        { id: 'p2', label: 'Sita Gurung' },
      ]
      return (
        <Combobox
          label="Search patients"
          query={q}
          onQueryChange={setQ}
          options={all.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))}
          onSelect={onSelect}
          emptyText="No match"
        />
      )
    }
    const { container } = render(<Demo />)
    const input = screen.getByRole('combobox', { name: 'Search patients' })
    await userEvent.type(input, 'a')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p2' }))
    await userEvent.type(input, 'zz')
    expect(screen.getByText('No match')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await userEvent.clear(input)
    await userEvent.type(input, 'Ram')
    await userEvent.pointer({ keys: '[MouseLeft]', target: screen.getByRole('option', { name: /Ram Bahadur/ }) })
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'p1' }))
  })
})

describe('Calendar', () => {
  it('renders marks with text and month navigation', async () => {
    const onPrev = vi.fn()
    const { container } = render(
      <section aria-labelledby="cal">
        <Calendar
          titleId="cal"
          title="October 2026"
          weekdays={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          cells={[
            { key: 'p', day: '', today: false, weekend: false, marks: [] },
            {
              key: '21',
              day: '21',
              today: true,
              weekend: false,
              marks: [{ label: 'PK Conference', full: 'Dr. Prakash Karki, conference', tone: 'leave' }],
            },
            {
              key: '22',
              day: '22',
              today: false,
              weekend: true,
              marks: [{ label: 'RA 14:00', full: 'Dr. Rohan Adhikari, meeting', tone: 'part' }],
            },
          ]}
          legend={{ leave: 'Leave', part: 'Part-day block' }}
          prevLabel="Previous month"
          nextLabel="Next month"
          onPrev={onPrev}
          onNext={() => undefined}
        />
      </section>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(onPrev).toHaveBeenCalled()
    expect(screen.getByText(/Dr. Prakash Karki, conference/)).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

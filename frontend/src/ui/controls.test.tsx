import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expectNoA11yViolations } from '@/test/a11y'
import { Button } from './Button'
import { ButtonLink } from './ButtonLink'
import { IconButton } from './IconButton'
import { TextAction } from './TextAction'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Select } from './Select'
import { Textarea } from './Textarea'
import { Checkbox } from './Checkbox'
import { Radio } from './Radio'
import { Switch } from './Switch'
import { SegmentedControl } from './SegmentedControl'
import { Chip } from './Chip'
import { SearchInput } from './SearchInput'

describe('buttons', () => {
  it('render accessibly and fire clicks', async () => {
    const onClick = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <Button variant="primary" onClick={onClick}>
          Save
        </Button>
        <Button variant="danger" size="sm">
          Delete
        </Button>
        <Button variant="ghost" size="lg" block disabled>
          Ghost
        </Button>
        <ButtonLink to="/portal/book" variant="primary">
          Book
        </ButtonLink>
        <IconButton icon="bell" label="Notifications" />
        <IconButton icon="chevronLeft" label="Previous" outlined />
        <TextAction>Edit</TextAction>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Book' })).toHaveAttribute('href', '/portal/book')
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

describe('form controls', () => {
  it('wire labels, hints and errors', async () => {
    const { container } = render(
      <form>
        <Field label="Email" hint="We never share it" error="Required">
          {(c) => <TextInput {...c} size="lg" autoComplete="email" />}
        </Field>
        <Field label="Slot length" compact>
          {(c) => <Select {...c} size="sm" options={[{ value: '20', label: '20 min' }]} />}
        </Field>
        <Field label="Note">{(c) => <Textarea {...c} rows={2} />}</Field>
        <Checkbox label="Release to portal" defaultChecked />
        <fieldset>
          <legend>Reason</legend>
          <Radio name="r" label="Feeling better" hint="No longer needed" defaultChecked />
          <Radio name="r" label="Other" />
        </fieldset>
      </form>,
    )
    const email = screen.getByLabelText('Email')
    expect(email).toHaveAccessibleDescription('We never share it Required')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    await expectNoA11yViolations(container)
  })

  it('toggles a switch, segmented control and chip', async () => {
    const onSwitch = vi.fn()
    const onSeg = vi.fn()
    const onChip = vi.fn()
    const { container } = render(
      <div>
        <Switch checked={false} onChange={onSwitch} label="Release to patient" />
        <SegmentedControl
          label="Account type"
          value="patient"
          options={[
            { value: 'patient', label: 'Patient' },
            { value: 'staff', label: 'Hospital staff' },
            { value: 'x', label: 'Disabled', disabled: true },
          ]}
          onChange={onSeg}
          inline
          size="lg"
        />
        <Chip label="Cardiology" count={3} selected onToggle={onChip} size="lg" />
        <Chip label="All" selected={false} onToggle={onChip} />
        <SearchInput label="Search patients" size="lg" suffix={<span>/</span>} />
      </div>,
    )
    await userEvent.click(screen.getByRole('switch', { name: 'Release to patient' }))
    expect(onSwitch).toHaveBeenCalledWith(true)
    await userEvent.click(screen.getByRole('button', { name: 'Hospital staff' }))
    expect(onSeg).toHaveBeenCalledWith('staff')
    expect(screen.getByRole('button', { name: 'Patient' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Cardiology 3' }))
    expect(onChip).toHaveBeenCalled()
    expect(screen.getByRole('searchbox', { name: 'Search patients' })).toHaveAttribute('autocomplete', 'off')
    await expectNoA11yViolations(container)
  })
})

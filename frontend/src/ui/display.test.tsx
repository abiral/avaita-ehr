import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { expectNoA11yViolations } from '@/test/a11y'
import { Avatar } from './Avatar'
import { Banner } from './Banner'
import { Card } from './Card'
import { CardHeader } from './CardHeader'
import { EmptyState } from './EmptyState'
import { LinkTabs } from './LinkTabs'
import { PageHeader } from './PageHeader'
import { RangeBar, rangePosition } from './RangeBar'
import { SafeHtml, sanitize } from './SafeHtml'
import { Skeleton } from './Skeleton'
import { SkeletonRows } from './SkeletonRows'
import { Sparkline, sparkPoints } from './Sparkline'
import { Stepper } from './Stepper'
import { Table } from './Table'
import { Tabs } from './Tabs'
import { Tag } from './Tag'
import { TrendChart } from './TrendChart'
import { Logo } from './icons/Logo'

describe('display primitives', () => {
  it('render accessibly', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/staff/patients/p1']}>
        <main>
          <Logo size="lg" />
          <PageHeader
            title="Today"
            eyebrow="Tuesday, 20 October"
            sub="Ward 4B"
            actions={<button type="button">Go</button>}
          />
          <Card as="section" labelledBy="h">
            <CardHeader id="h" title="My patients" sub="8 patients" action={<a href="/x">All</a>} />
            <EmptyState title="No patients" body="Nothing assigned" />
            <SkeletonRows label="Loading patients" rows={2} />
          </Card>
          <Card padded>
            <Avatar initials="RP" />
            <Avatar initials="AS" size="lg" />
            <Tag>Normal</Tag>
            <Tag tone="info">Confirmed</Tag>
            <Tag tone="alert">High</Tag>
            <Tag tone="critical" size="sm">
              Critical
            </Tag>
            <Tag tone="warn">Leave</Tag>
            <Tag tone="outline">Draft</Tag>
            <Skeleton width={40} />
          </Card>
          <Banner tone="critical" title="Critical result:" action={<button type="button">Review</button>}>
            Potassium 6.1 mmol/L
          </Banner>
          <Banner tone="warn">Check</Banner>
          <Banner tone="neutral">Plain</Banner>
          <Banner>Info</Banner>
          <Stepper label="Booking progress" steps={['Doctor', 'Visit type', 'Time', 'Confirm']} current={2} />
          <LinkTabs
            label="Chart"
            items={[
              { to: '/staff/patients/p1', label: 'Summary', end: true },
              { to: '/staff/patients/p1/notes', label: 'Notes' },
            ]}
          />
          <Table
            caption="Patients"
            columns={[
              { key: 'n', header: 'Name', cell: (r: { n: string }) => r.n },
              { key: 'b', header: 'Bed', cell: () => '12', align: 'right', width: '60px' },
            ]}
            rows={[{ n: 'Ram Bahadur Thapa' }]}
            rowKey={(r) => r.n}
          />
          <RangeBar value={5.3} low={3.5} high={5.1} label="Potassium 5.3 mmol/L, high" rangeText="3.5 to 5.1 mmol/L" />
          <Sparkline values={[38.6, 38.2, 37.9, 37.8]} label="Temperature over 4 days" />
          <TrendChart
            title="Potassium, last 4 days"
            note="Shaded band: normal range"
            summary="Potassium rising from 4.9 to 6.1"
            band={{ low: 3.5, high: 5.1 }}
            domain={{ min: 3, max: 6.5 }}
            ticks={[3.5, 5.1, 6]}
            points={[
              { label: '17 Oct', value: 4.9, description: '17 Oct: 4.9 mmol/L', outOfRange: false },
              { label: '20 Oct', value: 6.1, description: '20 Oct: 6.1 mmol/L, critical', outOfRange: true },
            ]}
          />
          <SafeHtml html="<p>Hi <a href='https://example.org'>link</a><script>bad()</script></p>" />
        </main>
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Potassium 6.1 mmol/L')
    expect(screen.getByRole('link', { name: 'Summary' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('img', { name: 'Potassium 5.3 mmol/L, high' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('computes positions and sanitizes HTML', () => {
    expect(rangePosition(4.3, 3.5, 5.1)).toBeCloseTo(50)
    expect(rangePosition(100, 3.5, 5.1)).toBe(97)
    expect(rangePosition(-100, 3.5, 5.1)).toBe(3)
    expect(rangePosition(1, 1, 1)).toBe(25)
    expect(sparkPoints([1], 120, 28)).toEqual([[6, 22]])
    const clean = sanitize('<a href="https://x.org" onclick="x()">x</a><img src=x onerror=y>')
    expect(clean).toBe('<a href="https://x.org" target="_blank" rel="noopener noreferrer">x</a>')
  })

  it('moves between tabs with arrow keys', async () => {
    function Demo() {
      const [v, setV] = useState<'a' | 'b'>('a')
      return (
        <>
          <Tabs
            label="Scope"
            idPrefix="t"
            value={v}
            onChange={setV}
            items={[
              { value: 'a', label: 'Mine', count: 8 },
              { value: 'b', label: 'Ward' },
            ]}
          />
          <div role="tabpanel" id="t-panel" aria-labelledby={`t-${v}`}>
            {v}
          </div>
        </>
      )
    }
    const { container } = render(<Demo />)
    screen.getByRole('tab', { name: 'Mine 8' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Ward' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Ward' })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('a')
    await expectNoA11yViolations(container)
  })
})

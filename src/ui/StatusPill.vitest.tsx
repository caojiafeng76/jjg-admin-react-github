import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import StatusPill from './StatusPill'

afterEach(cleanup)

describe('StatusPill', () => {
  it.each([
    ['success', 'bg-success/10 text-success'],
    ['warning', 'bg-warning/10 text-warning'],
    ['danger', 'bg-error/10 text-error'],
    ['neutral', 'bg-slate-100 text-slate-600'],
  ] as const)('renders %s tone with semantic classes', (tone, expected) => {
    const { container } = render(<StatusPill tone={tone}>生产中</StatusPill>)
    const pill = container.querySelector('span')
    expect(pill?.className).toContain(expected)
    expect(screen.getByText('生产中')).toBeTruthy()
  })

  it('renders a status dot by default', () => {
    const { container } = render(<StatusPill tone="success">已结案</StatusPill>)
    expect(container.querySelector('.size-1\\.5')).toBeTruthy()
  })

  it('hides the dot when dot={false}', () => {
    const { container } = render(
      <StatusPill tone="neutral" dot={false}>
        中性
      </StatusPill>,
    )
    expect(container.querySelector('.size-1\\.5')).toBeNull()
  })

  it('merges custom className', () => {
    const { container } = render(
      <StatusPill tone="danger" className="mt-1">
        异常
      </StatusPill>,
    )
    expect(container.querySelector('span')?.className).toContain('mt-1')
  })
})
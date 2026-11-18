import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import Dashboard from './Dashboard'

it('shows the update log newest first without a statistics query provider', () => {
  render(<Dashboard />)

  const log = screen.getByRole('region', { name: '更新日志' })
  const dates = within(log).getAllByRole('time').map(date => date.getAttribute('datetime'))

  expect(dates).toEqual([...new Set(dates)].sort().reverse())
  expect(dates.every(date => date !== null && date >= '2026-11-01')).toBe(true)
  expect(dates).toContain('2026-11-02')
  expect(within(log).getByText(/在手机「扫码」页/)).toBeInTheDocument()
  expect(screen.queryByText('经营概览')).not.toBeInTheDocument()
})

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import SelectedSummaryBar from './SelectedSummaryBar'

afterEach(cleanup)

describe('SelectedSummaryBar', () => {
  it('renders selected count and stats with formatted values', () => {
    render(
      <SelectedSummaryBar
        selectedCount={3}
        matchedCount={3}
        stats={[
          { label: '转移数量合计', value: 12345, tone: 'error', icon: <svg /> },
        ]}
      />,
    )

    expect(screen.getByText(/已选/)).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText(/转移数量合计/)).toBeTruthy()
    expect(screen.getByText('12,345')).toBeTruthy()
  })

  it('shows partial-page hint when matchedCount < selectedCount', () => {
    render(
      <SelectedSummaryBar
        selectedCount={5}
        matchedCount={2}
        stats={[{ label: '转移数量合计', value: 10, tone: 'error', icon: <svg /> }]}
      />,
    )

    expect(screen.getByText(/当前页参与合计 2 条/)).toBeTruthy()
  })

  it('omits partial-page hint when all selected rows are matched', () => {
    render(
      <SelectedSummaryBar
        selectedCount={2}
        matchedCount={2}
        stats={[{ label: '转移数量合计', value: 10, tone: 'error', icon: <svg /> }]}
      />,
    )

    expect(screen.queryByText(/当前页参与合计/)).toBeNull()
  })
})

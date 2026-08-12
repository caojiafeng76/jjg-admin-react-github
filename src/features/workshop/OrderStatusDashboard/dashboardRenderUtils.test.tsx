import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { renderJobOutputCell } from './dashboardRenderUtils'

afterEach(cleanup)

function makeRecord(
  jobOutputs: Record<string, number>,
  detailJobNames: string[],
) {
  return {
    jobOutputs,
    productionDetails: detailJobNames.map((jobName, index) => ({
      id: `detail-${index}`,
      jobName,
    })),
  } as unknown as OrderStatusDashboardItem
}

describe('renderJobOutputCell', () => {
  it('renders "-" when no quantity and no details', () => {
    const record = makeRecord({ 焊接: 0 }, [])
    const { container } = render(
      <>{renderJobOutputCell({ jobName: '焊接', onOpen: vi.fn(), record })}</>,
    )

    expect(container.textContent).toBe('-')
  })

  it('renders clickable 查看 when quantity is 0 but details exist', async () => {
    const onOpen = vi.fn()
    const record = makeRecord({ 焊接: 0 }, ['焊接'])
    render(
      <>{renderJobOutputCell({ jobName: '焊接', onOpen, record })}</>,
    )

    const link = screen.getByRole('button', { name: '查看' })
    await userEvent.click(link)
    expect(onOpen).toHaveBeenCalledWith(record, '焊接')
  })

  it('renders plain number when quantity exists but no details', () => {
    const record = makeRecord({ 焊接: 42 }, [])
    render(
      <>{renderJobOutputCell({ jobName: '焊接', onOpen: vi.fn(), record })}</>,
    )

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('renders clickable number when quantity and details exist', async () => {
    const onOpen = vi.fn()
    const record = makeRecord({ 焊接: 42 }, ['焊接'])
    render(
      <>{renderJobOutputCell({ jobName: '焊接', onOpen, record })}</>,
    )

    const link = screen.getByRole('button', { name: '42' })
    await userEvent.click(link)
    expect(onOpen).toHaveBeenCalledWith(record, '焊接')
  })
})

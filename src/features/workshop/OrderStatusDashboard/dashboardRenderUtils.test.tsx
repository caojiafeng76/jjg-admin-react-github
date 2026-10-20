import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getInventoryBreakdownText,
  renderInventoryQuantityCell,
  renderJobOutputCell,
} from './dashboardRenderUtils'

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

describe('renderInventoryQuantityCell', () => {
  const makeInventoryRecord = (inventoryQuantity: number) =>
    ({
      autoCutQuantity: 50,
      inventoryQuantity,
      precisionCuttingQuantity: 100,
      totalDefectQuantity: 5,
      transferQuantity: 120,
    }) as unknown as OrderStatusDashboardItem

  it('builds the breakdown text', () => {
    expect(getInventoryBreakdownText(makeInventoryRecord(25))).toBe(
      '精切 100 + 自动切 50 - 报废 5 - 转移 120',
    )
  })

  it('renders negative inventory in danger style', () => {
    render(<>{renderInventoryQuantityCell(makeInventoryRecord(-4))}</>)
    expect(screen.getByText('-4').closest('.ant-typography-danger')).not.toBe(
      null,
    )
  })

  it('renders "-" for zero inventory', () => {
    render(<>{renderInventoryQuantityCell(makeInventoryRecord(0))}</>)
    expect(screen.getByText('-')).toBeTruthy()
  })
})

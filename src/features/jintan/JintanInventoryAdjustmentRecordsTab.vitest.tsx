import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import JintanInventoryAdjustmentRecordsTab from './JintanInventoryAdjustmentRecordsTab'
import { jintanKeys } from './queryKeys'

const getList = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiJintanInventoryAdjustments', () => ({
  getJintanInventoryAdjustmentList: getList,
}))

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <JintanInventoryAdjustmentRecordsTab
        category="materials"
        inventoryId="inv-1"
      />
    </QueryClientProvider>,
  )
}

describe('JintanInventoryAdjustmentRecordsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => cleanup())

  it('lists before, after, signed difference and operator for the inventory', async () => {
    getList.mockResolvedValue({
      items: [
        {
          id: 'a-1',
          quantity_before: 25,
          quantity_after: 16,
          difference: -9,
          remarks: '月底盘点',
          operator_name: '张三',
          created_at: '2026-11-04T02:59:56.000Z',
        },
        {
          id: 'a-2',
          quantity_before: 16,
          quantity_after: 18,
          difference: 2,
          remarks: '',
          operator_name: '',
          created_at: '2026-11-04T03:00:00.000Z',
        },
      ],
      total: 2,
    })

    renderTab()

    const firstRow = (await screen.findByText('张三')).closest('tr') as HTMLElement
    expect(within(firstRow).getByText('25')).toBeInTheDocument()
    expect(within(firstRow).getByText('16')).toBeInTheDocument()
    expect(within(firstRow).getByText('-9')).toHaveClass('text-red-500')
    expect(within(firstRow).getByText('月底盘点')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(getList).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv-1', page: 1, pageSize: 10 }),
    )
  })

  it('shows the empty state when the inventory has no adjustments', async () => {
    getList.mockResolvedValue({ items: [], total: 0 })

    renderTab()

    expect(await screen.findByText('暂无调整记录')).toBeInTheDocument()
  })

  it('shows a retryable error when loading fails', async () => {
    getList.mockRejectedValue(new Error('network'))

    renderTab()

    expect(await screen.findByText('获取库存调整记录失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /重\s*试/ })).toBeInTheDocument()
  })
})

describe('jintan inventory adjustment query keys', () => {
  it('stay under each inventory root so inventory mutations refresh them', () => {
    const params = { inventoryId: 'inv-1', page: 1, pageSize: 10 }

    expect(jintanKeys.partsInventory.adjustments(params)[0]).toBe(
      jintanKeys.partsInventory.all[0],
    )
    expect(jintanKeys.profilesInventory.adjustments(params)[0]).toBe(
      jintanKeys.profilesInventory.all[0],
    )
    expect(jintanKeys.materialsInventory.adjustments(params)[0]).toBe(
      jintanKeys.materialsInventory.all[0],
    )
  })
})

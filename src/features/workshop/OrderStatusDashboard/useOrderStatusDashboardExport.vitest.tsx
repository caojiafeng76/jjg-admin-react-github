import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDashboardOrder, DASHBOARD_JOB_COLUMNS } from '@/test/fixtures/orderStatusDashboard'
import { useOrderStatusDashboardExport } from './useOrderStatusDashboardExport'

const mocks = vi.hoisted(() => ({
  exportExcel: vi.fn(),
  message: { open: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

vi.mock('antd', () => ({ App: { useApp: () => ({ message: mocks.message }) } }))
vi.mock('@/utils/orderStatusDashboardExcel', () => ({ exportOrderStatusDashboardToExcel: mocks.exportExcel }))

describe('useOrderStatusDashboardExport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('takes a deep snapshot before loading Excel so later data and page changes cannot affect it', async () => {
    const row = createDashboardOrder({ jobOutputs: { CNC: 12 } })
    const jobColumns = structuredClone(DASHBOARD_JOB_COLUMNS)
    const { result, rerender } = renderHook(props => useOrderStatusDashboardExport(props), {
      initialProps: { rows: [row], jobColumns, startIndex: 20 },
    })
    let pendingExport: Promise<void>
    act(() => {
      pendingExport = result.current.handleExportCurrentPage()
    })
    expect(result.current.isExporting).toBe(true)
    row.order_quantity = 999
    row.jobOutputs.CNC = 999
    jobColumns[0].title = 'changed'
    rerender({ rows: [createDashboardOrder({ id: 'new-page' })], jobColumns: [], startIndex: 40 })
    await act(async () => pendingExport)
    expect(mocks.exportExcel).toHaveBeenCalledWith(
      [expect.objectContaining({ order_quantity: 100, jobOutputs: { CNC: 12 } })],
      DASHBOARD_JOB_COLUMNS,
      20,
    )
    expect(result.current.isExporting).toBe(false)
  })

  it('warns for an empty visible page without generating a file', async () => {
    const { result } = renderHook(() => useOrderStatusDashboardExport({ rows: [], jobColumns: [], startIndex: 0 }))
    await act(async () => result.current.handleExportCurrentPage())
    expect(mocks.message.warning).toHaveBeenCalledWith('当前页没有可导出的订单现状数据')
    expect(mocks.exportExcel).not.toHaveBeenCalled()
    expect(mocks.message.open).not.toHaveBeenCalled()
  })

  it('reports export failures and clears loading so the user can retry', async () => {
    mocks.exportExcel.mockImplementationOnce(() => {
      throw new Error('private internal exception')
    })
    const { result } = renderHook(() => useOrderStatusDashboardExport({ rows: [createDashboardOrder()], jobColumns: [], startIndex: 0 }))
    await act(async () => result.current.handleExportCurrentPage())
    expect(mocks.message.error).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('订单现状') }))
    expect(mocks.message.success).not.toHaveBeenCalled()
    expect(result.current.isExporting).toBe(false)
    await act(async () => result.current.handleExportCurrentPage())
    expect(mocks.message.success).toHaveBeenCalledOnce()
  })
})

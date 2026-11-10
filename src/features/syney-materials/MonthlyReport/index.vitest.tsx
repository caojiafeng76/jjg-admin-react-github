import type { SyneyMaterialsMonthlyReportRow } from '@/services/apiSyneyMaterialsReport'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SyneyMaterialsMonthlyReportPage from './index'

const rows: SyneyMaterialsMonthlyReportRow[] = [
  {
    inventory_id: 'i-1',
    material_name: '钢板',
    specification: '2mm',
    unit: '张',
    opening_quantity: 10,
    stock_in_quantity: 5,
    stock_out_quantity: 3,
    stock_adjust_quantity: -2,
    closing_quantity: 10,
    current_quantity: 10,
  },
]

const getReport = vi.hoisted(() => vi.fn())
const exportToExcel = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiSyneyMaterialsReport', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getSyneyMaterialsMonthlyReport: getReport }
})
vi.mock('@/utils/syneyMaterialsExcel', () => ({
  exportSyneyMaterialsReportToExcel: exportToExcel,
}))
vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '无操作权限',
  }),
}))
vi.mock('@/hooks/useTableHeight', () => ({
  useTableHeight: () => ({
    paginationRef: { current: null },
    rowHeight: 30,
    scrollY: 320,
    tableContainerRef: { current: null },
  }),
}))

function renderPage(path = '/syney-materials-monthly-report?month=2026-10') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App>
          <SyneyMaterialsMonthlyReportPage />
        </App>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('西尼材料月度报表页', () => {
  it('按 URL 月份加载并显示行与合计', async () => {
    getReport.mockResolvedValue(rows)
    renderPage()

    expect(await screen.findByText('钢板')).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('2026-10')
    expect(screen.getByText('合计')).toBeInTheDocument()
    expect(screen.getAllByText('-2').length).toBeGreaterThan(0)
  })

  it('导出所选月份', async () => {
    getReport.mockResolvedValue(rows)
    renderPage()

    await screen.findByText('钢板')
    fireEvent.click(screen.getByRole('button', { name: /导出月度报表/ }))

    await waitFor(() =>
      expect(exportToExcel).toHaveBeenCalledWith(rows, '2026-10'),
    )
  })

  it('没有数据时不导出', async () => {
    getReport.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('暂无材料库存')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /导出月度报表/ }))

    expect(await screen.findByText('当前没有可导出的材料库存数据')).toBeInTheDocument()
    expect(exportToExcel).not.toHaveBeenCalled()
  })
})

import type { WorkshopMiscMaterialsMonthlyReportRow } from '@/services/apiWorkshopMiscMaterialsReport'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WorkshopMiscMaterialsMonthlyReportPage from './index'

const rows: WorkshopMiscMaterialsMonthlyReportRow[] = [
  {
    inventory_id: 'i-1',
    model: '196-A01',
    customer_model: 'C-196',
    specification: '2mm',
    category: '铝材',
    opening_quantity: 10,
    stock_in_quantity: 5,
    stock_out_quantity: 3,
    stock_adjust_quantity: -2,
    closing_quantity: 10,
    current_quantity: 10,
  },
  {
    inventory_id: 'i-2',
    model: '267-B01',
    customer_model: '',
    specification: '3mm',
    category: '辅料',
    opening_quantity: 20,
    stock_in_quantity: 0,
    stock_out_quantity: 4,
    stock_adjust_quantity: 0,
    closing_quantity: 16,
    current_quantity: 16,
  },
]

const getReport = vi.hoisted(() => vi.fn())
const getCategories = vi.hoisted(() => vi.fn().mockResolvedValue(['铝材', '辅料']))
const exportToExcel = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiWorkshopMiscMaterialsReport', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getWorkshopMiscMaterialsMonthlyReport: getReport }
})
vi.mock('@/services/apiWorkshopMiscMaterialsData', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getWorkshopMiscMaterialsCategories: getCategories }
})
vi.mock('@/utils/workshopMiscMaterialsExcel', () => ({
  exportWorkshopMiscMaterialsReportToExcel: exportToExcel,
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

function renderPage(
  path = '/workshop-misc-materials-monthly-report?month=2026-10',
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App>
          <WorkshopMiscMaterialsMonthlyReportPage />
        </App>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('车间杂项材料月度报表页', () => {
  it('按 URL 月份与维度加载并显示行与合计', async () => {
    getReport.mockResolvedValue(rows)
    renderPage()

    expect(await screen.findByText('196-A01')).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('2026-10', 'total')
    expect(screen.getByRole('cell', { name: '合计' })).toBeInTheDocument()
    expect(screen.getAllByText('-2').length).toBeGreaterThan(0)
  })

  it('切换维度并按类别筛选后导出', async () => {
    getReport.mockResolvedValue(rows)
    renderPage('/workshop-misc-materials-monthly-report?month=2026-10&stage=raw&category=铝材')

    expect(await screen.findByText('196-A01')).toBeInTheDocument()
    expect(screen.queryByText('267-B01')).toBeNull()
    expect(getReport).toHaveBeenCalledWith('2026-10', 'raw')

    fireEvent.click(screen.getByRole('button', { name: /导出月度报表/ }))

    await waitFor(() =>
      expect(exportToExcel).toHaveBeenCalledWith([rows[0]], {
        month: '2026-10',
        stage: 'raw',
        category: '铝材',
      }),
    )
  })

  it('切换分段维度会按新维度重新请求并导出', async () => {
    getReport.mockResolvedValue(rows)
    renderPage()

    await screen.findByText('196-A01')
    fireEvent.click(screen.getByText('半成品'))

    await waitFor(() =>
      expect(getReport).toHaveBeenCalledWith('2026-10', 'semi'),
    )
  })

  it('没有数据时不导出', async () => {
    getReport.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('暂无材料库存')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /导出月度报表/ }))

    expect(
      await screen.findByText('当前没有可导出的材料库存数据'),
    ).toBeInTheDocument()
    expect(exportToExcel).not.toHaveBeenCalled()
  })
})

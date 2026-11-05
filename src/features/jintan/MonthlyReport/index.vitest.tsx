import type { JintanMonthlyReport } from '@/services/apiJintanMonthlyReport'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import JintanMonthlyReportPage from './index'

const report: JintanMonthlyReport = {
  parts: [
    {
      category: 'parts',
      item_type: '',
      inventory_id: 'p-1',
      item_model: '',
      item_name: '十字沉头螺钉',
      specification: 'ST4.2*20',
      material: 'SUS304',
      supplier: '',
      opening_quantity: 100,
      stock_in_quantity: 20,
      stock_out_quantity: 30,
      stock_adjust_quantity: 0,
      closing_quantity: 90,
      current_quantity: 90,
    },
  ],
  profiles: [
    {
      category: 'profiles',
      item_type: '',
      inventory_id: 'pr-1',
      item_model: '140U',
      item_name: '铝合金立柱',
      specification: '3米',
      material: '6063',
      supplier: '',
      opening_quantity: 8,
      stock_in_quantity: 2,
      stock_out_quantity: 4,
      stock_adjust_quantity: 0,
      closing_quantity: 6,
      current_quantity: 6,
    },
  ],
  materials: [],
}

const getReport = vi.hoisted(() => vi.fn())
const exportToExcel = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiJintanMonthlyReport', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getJintanMonthlyInventoryReport: getReport }
})
vi.mock('@services/apiJintanMonthlyReport', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, getJintanMonthlyInventoryReport: getReport }
})
vi.mock('@/utils/jintanMonthlyReportExcel', () => ({
  exportJintanMonthlyReportToExcel: exportToExcel,
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

function renderPage(path = '/jintan-monthly-report?month=2026-10') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App>
          <JintanMonthlyReportPage />
        </App>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('jintanMonthlyReportPage', () => {
  it('loads the month from the URL and shows the parts sheet first', async () => {
    getReport.mockResolvedValue(report)
    renderPage()

    expect(await screen.findByText('十字沉头螺钉')).toBeTruthy()
    expect(getReport).toHaveBeenCalledWith('2026-10')
    expect(screen.queryByText('铝合金立柱')).toBeNull()
  })

  it('switches between categories', async () => {
    getReport.mockResolvedValue(report)
    renderPage()

    await screen.findByText('十字沉头螺钉')
    fireEvent.click(screen.getByText('型材（1）'))

    expect(await screen.findByText('铝合金立柱')).toBeTruthy()
  })

  it('exports all three categories for the selected month in one workbook', async () => {
    getReport.mockResolvedValue(report)
    renderPage()

    await screen.findByText('十字沉头螺钉')
    fireEvent.click(screen.getByRole('button', { name: /导出月度报表/ }))

    await waitFor(() =>
      expect(exportToExcel).toHaveBeenCalledWith(report, '2026-10'),
    )
  })
})

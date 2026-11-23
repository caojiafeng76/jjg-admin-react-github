import type { Key, ReactNode } from 'react'
import type { SyneyPoDetail } from '@/services/apiSyneyPo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PoDetail from './PoDetail'
import PoSelected from './PoList/PoSelected'
import { useFetchSelectedPos } from './PoList/useFetchSelectedPos'
import ReportDetail from './ReportDetail'
import TableSelectionProvider from './TableSelectionProvider'

const mocks = vi.hoisted(() => ({
  hasEditPermission: true,
  getSelectedPosWithItems: vi.fn(),
  updatePos: vi.fn(),
  getSyneyPoDetail: vi.fn(),
  getSyneyStoreReport: vi.fn(),
  getSyneyStoreReportHeader: vi.fn(),
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: (key: string) =>
    key === 'feature:syney-po-list.edit' ? mocks.hasEditPermission : true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

vi.mock('@/hooks/useTableHeight', () => ({
  useTableHeight: () => ({
    tableContainerRef: { current: null },
    paginationRef: { current: null },
    scrollY: 400,
  }),
}))

vi.mock('@/services/apiSyneyPos', () => ({
  getSelectedPosWithItems: mocks.getSelectedPosWithItems,
  updatePos: mocks.updatePos,
}))

vi.mock('@/services/apiSyneyPo', () => ({
  getSyneyPoDetail: mocks.getSyneyPoDetail,
  updatePoItems: vi.fn(),
}))

vi.mock('@/services/apiSyneyStoreReports', () => ({
  getSyneyStoreReport: mocks.getSyneyStoreReport,
  getSyneyStoreReportHeader: mocks.getSyneyStoreReportHeader,
}))

vi.mock('@/services/apiSyneyStoreReport', () => ({
  updateSyneyStoreReport: vi.fn(),
  deleteSyneyStoreReportItems: vi.fn(),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithProviders(
  ui: ReactNode,
  { initialEntry = '/', routePath = '*', selectedKeys = [] as Key[] } = {},
) {
  const queryClient = createQueryClient()
  return render(
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route
                path={routePath}
                element={(
                  <TableSelectionProvider initialSelectedKeys={selectedKeys}>
                    {ui}
                  </TableSelectionProvider>
                )}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('Phase 1 regressions', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasEditPermission = true
  })

  it('useFetchSelectedPos does not fetch on row selection until explicitly invoked', async () => {
    mocks.getSelectedPosWithItems.mockResolvedValue([])
    const queryClient = createQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TableSelectionProvider initialSelectedKeys={[11, 12]}>
          {children}
        </TableSelectionProvider>
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useFetchSelectedPos(), { wrapper })
    expect(mocks.getSelectedPosWithItems).not.toHaveBeenCalled()

    await result.current.fetchSelectedPos()
    expect(mocks.getSelectedPosWithItems).toHaveBeenCalledWith(
      [11, 12],
      expect.any(AbortSignal),
    )
  })

  it('PoSelected warns on empty selection and disables when lacking edit permission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PoSelected />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByText('已送货'))
    expect(mocks.updatePos).not.toHaveBeenCalled()
    expect(await screen.findByText('请先选择要修改状态的数据')).toBeInTheDocument()

    cleanup()
    mocks.hasEditPermission = false
    renderWithProviders(<PoSelected />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('PoDetail renders inline TableState error with retry instead of throwing during render', async () => {
    mocks.getSyneyPoDetail.mockRejectedValueOnce(new Error('network down'))

    renderWithProviders(<PoDetail />, {
      initialEntry: '/syney-po-list/759',
      routePath: '/syney-po-list/:PoId',
    })

    expect(await screen.findByRole('button', { name: /重\s*试/ })).toBeInTheDocument()
  })

  it('PoDetail sums only current-page items in summary row and enforces edit permission', async () => {
    const detail: SyneyPoDetail = {
      id: 759,
      No: 'P2026',
      SONo: 'SO-759',
      Spec: '1000型-室内-扶梯',
      EndDate: '2026-11-30',
      Status: '已创建',
      Qty: 1,
      Brand: '西尼',
      Technique: null,
      SerialNo: 100,
      Remark: null,
      created_at: '2026-11-23',
      items: Array.from({ length: 11 }, (_, idx) => ({
        id: idx + 1,
        No: 'P2026',
        PartNo: `XN-${idx + 1}`,
        PartName: '踏板',
        Spec: '1000型',
        ParamSpec: '1525*500',
        Qty: idx < 10 ? 1 : 50,
        Unit: 'EA',
        SONo: 'SO-759',
        Remark: null,
      })),
    }
    mocks.getSyneyPoDetail.mockResolvedValue(detail)
    mocks.hasEditPermission = false

    renderWithProviders(<PoDetail />, {
      initialEntry: '/syney-po-list/759?page=1&pageSize=10',
      routePath: '/syney-po-list/:PoId',
    })

    expect(await screen.findByText('当前页合计')).toBeInTheDocument()
    await waitFor(() => {
      const summaryRow = screen.getByText('当前页合计').closest('tr')
      expect(summaryRow?.textContent).toContain('10')
      expect(summaryRow?.textContent).not.toContain('60')
    })

    expect(screen.getByRole('button', { name: /编\s*辑/ })).toBeDisabled()
  })

  it('ReportDetail renders inline TableState error with retry instead of throwing during render', async () => {
    mocks.getSyneyStoreReport.mockRejectedValueOnce(new Error('load failed'))
    mocks.getSyneyStoreReportHeader.mockRejectedValueOnce(new Error('load failed'))

    renderWithProviders(<ReportDetail />, {
      initialEntry: '/syney-store-report-list/R-1',
      routePath: '/syney-store-report-list/:reportNo',
    })

    expect(await screen.findByRole('button', { name: /重\s*试/ })).toBeInTheDocument()
  })
})

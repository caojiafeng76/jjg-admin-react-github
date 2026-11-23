import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUrlListState } from '@/hooks/useUrlListState'
import SyneySetting from '@/pages/SyneySetting'
import PoDetail from './PoDetail'
import DeliveryOrderButton from './PoList/DeliveryOrderButton'
import ExportInfoButton from './PoList/ExportInfoButton'
import ExportShippingListButton from './PoList/ExportShippingListButton'
import PoSearch from './PoList/PoSearch'
import ReportDetail from './ReportDetail'
import ReportSearch from './ReportList/ReportSearch'
import SpecSearch from './SpecList/SpecSearch'
import TableSelectionProvider from './TableSelectionProvider'

const mocks = vi.hoisted(() => ({
  allowedPermissions: new Set<string>(),
  getSyneyPoDetail: vi.fn(),
  updatePoItems: vi.fn(),
  getSyneyStoreReport: vi.fn(),
  getSyneyStoreReportHeader: vi.fn(),
  updateSyneyStoreReport: vi.fn(),
  getSerialNo: vi.fn(),
  updateSerialNo: vi.fn(),
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: (key: string) => mocks.allowedPermissions.has(key),
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

vi.mock('@/services/apiSyneyPo', () => ({
  getSyneyPoDetail: mocks.getSyneyPoDetail,
  updatePoItems: mocks.updatePoItems,
}))

vi.mock('@/services/apiSyneyStoreReports', () => ({
  getSyneyStoreReport: mocks.getSyneyStoreReport,
  getSyneyStoreReportHeader: mocks.getSyneyStoreReportHeader,
}))

vi.mock('@/services/apiSyneyStoreReport', () => ({
  updateSyneyStoreReport: mocks.updateSyneyStoreReport,
  deleteSyneyStoreReportItems: vi.fn(),
}))

vi.mock('@/services/apiSyneySerialNo', () => ({
  getSerialNo: mocks.getSerialNo,
  updateSerialNo: mocks.updateSerialNo,
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
  { initialEntries = ['/'], routePath = '*' } = {},
) {
  function LocationProbe() {
    const location = useLocation()
    return <div data-testid="location-search">{location.search}</div>
  }

  const queryClient = createQueryClient()
  return render(
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path={routePath} element={ui} />
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('Phase 2 regressions', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.allowedPermissions = new Set([
      'feature:syney-po-list.edit',
      'feature:syney-po-list.export',
      'feature:syney-po-list.delivery-order',
    ])
  })

  it('PoSearch syncs with URL, submits filters while preserving pageSize, and resets cleanly', async () => {
    function PoSearchHarness() {
      const { filters, setFilters, resetFilters } = useUrlListState([
        'Status',
        'startDate',
        'endDate',
        'SONo',
      ] as const)
      return <PoSearch values={filters} onSearch={setFilters} onReset={resetFilters} />
    }

    const user = userEvent.setup()
    renderWithProviders(<PoSearchHarness />, {
      initialEntries: ['/syney-po-list?page=3&pageSize=20&SONo=SO-10'],
    })

    const soInput = screen.getByLabelText('订单号或生产号')
    expect(soInput).toHaveValue('SO-10')

    await user.clear(soInput)
    await user.type(soInput, 'P2026')
    await user.click(screen.getByRole('button', { name: '搜索' }))

    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('SONo')).toBe('P2026')
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('20')
    })

    await user.click(screen.getByRole('button', { name: '重置' }))

    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('SONo')).toBeNull()
      expect(params.get('Status')).toBeNull()
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('20')
    })
  })

  it('ReportSearch syncs initial URL status, submits, and resets while keeping pageSize', async () => {
    function ReportSearchHarness() {
      const { filters, setFilters, resetFilters } = useUrlListState(['status'] as const)
      return <ReportSearch values={filters} onSearch={setFilters} onReset={resetFilters} />
    }

    const user = userEvent.setup()
    renderWithProviders(<ReportSearchHarness />, {
      initialEntries: ['/syney-store-report-list?page=2&pageSize=50&status=confirmed'],
    })

    expect(screen.getByText('已校对')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '重置' }))

    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('status')).toBeNull()
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('50')
    })

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByTitle('未校对'))
    await user.click(screen.getByRole('button', { name: '搜索' }))

    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('status')).toBe('unconfirmed')
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('50')
    })
  })

  it('SpecSearch only updates URL on submit/reset instead of each keystroke', async () => {
    function SpecSearchHarness() {
      const { filters, setFilters, resetFilters } = useUrlListState(['PartNo'] as const)
      return <SpecSearch values={filters} onSearch={setFilters} onReset={resetFilters} />
    }

    const user = userEvent.setup()
    renderWithProviders(<SpecSearchHarness />, {
      initialEntries: ['/syney-spec-list?page=2&pageSize=50'],
    })

    const input = screen.getByLabelText('件号')
    await user.type(input, 'XN28')
    expect(screen.getByTestId('location-search').textContent).toBe('?page=2&pageSize=50')

    await user.click(screen.getByRole('button', { name: '搜索' }))
    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('PartNo')).toBe('XN28')
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('50')
    })

    await user.click(screen.getByRole('button', { name: '重置' }))
    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('location-search').textContent || '')
      expect(params.get('PartNo')).toBeNull()
      expect(params.get('page')).toBe('1')
      expect(params.get('pageSize')).toBe('50')
    })
  })

  it('PoDetail shows FormErrorAlert inside modal and preserves input on update rejection', async () => {
    const user = userEvent.setup()
    mocks.getSyneyPoDetail.mockResolvedValue({
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
      items: [
        {
          id: 1,
          No: 'P2026',
          PartNo: 'XN2808X',
          PartName: '踏板',
          Spec: '1000型',
          ParamSpec: '1525*500',
          Qty: 1,
          Unit: 'EA',
          SONo: 'SO-759',
          Remark: null,
        },
      ],
    })
    mocks.updatePoItems.mockRejectedValueOnce(new Error('update failed'))

    renderWithProviders(<PoDetail />, {
      initialEntries: ['/syney-po-list/759'],
      routePath: '/syney-po-list/:PoId',
    })

    await user.click(await screen.findByLabelText('Select row 1'))
    await user.click(screen.getByRole('button', { name: /编\s*辑/ }))

    const paramInput = await screen.findByLabelText('参数规格')
    await user.clear(paramInput)
    await user.type(paramInput, '1525*600')
    await user.click(screen.getByRole('button', { name: '确 定' }))

    expect(await screen.findByText('操作失败')).toBeInTheDocument()
    expect(screen.getByText('订单明细更新失败：请稍后重试')).toBeInTheDocument()
    expect(screen.getByLabelText('参数规格')).toHaveValue('1525*600')
  })

  it('ReportDetail shows FormErrorAlert on update failure and clears selection when reportNo changes', async () => {
    const user = userEvent.setup()
    mocks.getSyneyStoreReportHeader.mockResolvedValue({
      No: 'K-1',
      Status: 'unconfirmed',
      TotalAmount: 100,
      created_at: '2026-11-23',
    })
    mocks.getSyneyStoreReport.mockResolvedValue([
      {
        id: 21,
        PartNo: 'XN2808X',
        PartName: '踏板',
        Spec: '1000型',
        ParamSpec: '1525*500',
        TaxUnitPrice: 100,
        Qty: 1,
        Unit: 'EA',
        TaxTotalPrice: 100,
        Remark: null,
      },
    ])
    mocks.updateSyneyStoreReport.mockRejectedValueOnce(new Error('save error'))

    const queryClient = createQueryClient()
    const rendered = render(
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/syney-store-report-list/K-1']}>
              <Routes>
                <Route
                  path="/syney-store-report-list/:reportNo"
                  element={<ReportDetail />}
                />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>,
    )

    await user.click(await screen.findByLabelText('Select row 1'))
    await user.click(screen.getByRole('button', { name: /编\s*辑/ }))

    const paramInput = await screen.findByLabelText('参数规格')
    await user.clear(paramInput)
    await user.type(paramInput, '1525*580')
    await user.click(screen.getByRole('button', { name: '确 定' }))

    expect(await screen.findByText('操作失败')).toBeInTheDocument()
    expect(screen.getByText('对账单明细更新失败：请稍后重试')).toBeInTheDocument()
    expect(screen.getByLabelText('参数规格')).toHaveValue('1525*580')

    rendered.unmount()

    // Verify ReportDetail clears its own selection state when navigating to a different reportNo
    function NavigateToNextReportButton() {
      const navigate = useNavigate()
      return (
        <button type="button" onClick={() => navigate('/syney-store-report-list/K-2')}>
          切换到 K-2
        </button>
      )
    }

    renderWithProviders(
      <>
        <ReportDetail />
        <NavigateToNextReportButton />
      </>,
      {
        initialEntries: ['/syney-store-report-list/K-1'],
        routePath: '/syney-store-report-list/:reportNo',
      },
    )

    await user.click(await screen.findByLabelText('Select row 1'))
    expect(await screen.findByText(/已选/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到 K-2' }))

    await waitFor(() => {
      expect(screen.queryByText(/已选/)).not.toBeInTheDocument()
      expect(screen.getByLabelText('Select row 1')).not.toBeChecked()
    })
  })

  it('disables PermissionButton action buttons when permission is denied and shows FormErrorAlert on SyneySetting failure', async () => {
    mocks.allowedPermissions.clear()

    renderWithProviders(
      <TableSelectionProvider>
        <DeliveryOrderButton />
        <ExportInfoButton />
        <ExportShippingListButton />
      </TableSelectionProvider>,
    )

    expect(screen.getByRole('button', { name: '生成送货单' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '导出安全部件信息' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '导出发货清单' })).toBeDisabled()

    cleanup()
    const user = userEvent.setup()
    mocks.getSerialNo.mockResolvedValue({ SyneySerialNo: 5000 })
    mocks.updateSerialNo.mockRejectedValueOnce(new Error('serial update error'))

    renderWithProviders(<SyneySetting />)

    const serialInput = await screen.findByLabelText('编号')
    expect(serialInput).toHaveValue('5000')
    await user.clear(serialInput)
    await user.type(serialInput, '5001')
    await user.click(screen.getByRole('button', { name: '保 存' }))

    expect(await screen.findByText('操作失败')).toBeInTheDocument()
    expect(screen.getByText('编号更新失败：请稍后重试')).toBeInTheDocument()
    expect(screen.getByLabelText('编号')).toHaveValue('5001')
  })
})

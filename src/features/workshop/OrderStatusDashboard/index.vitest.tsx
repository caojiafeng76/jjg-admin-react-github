import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { App } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDashboardOrder, createScreenshotDashboardOrders, DASHBOARD_JOB_COLUMNS } from '@/test/fixtures/orderStatusDashboard'
import OrderStatusDashboard from './index'

const mocks = vi.hoisted(() => ({
  exportExcel: vi.fn(),
  refetch: vi.fn(async () => undefined),
  role: 'admin',
  canManageStatus: false,
  pages: {} as Record<number, OrderStatusDashboardItem[]>,
  isPlaceholderData: false,
}))

vi.mock('@/utils/orderStatusDashboardExcel', () => ({ exportOrderStatusDashboardToExcel: mocks.exportExcel }))
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ role: mocks.role }) }))
vi.mock('@/hooks/usePermission', () => ({ usePermission: () => mocks.canManageStatus }))
vi.mock('@/features/workshop/OrderList/useWorkshopOrders', () => ({
  useBatchUpdateWorkshopOrderStatuses: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useWorkshopOrderModels: () => ({ data: ['105-268'] }),
}))
vi.mock('./useOrderStatusDashboard', () => ({
  ORDER_STATUS_DASHBOARD_KEY: 'order-status-dashboard',
  useOrderStatusDashboard: ({ page }: { page: number }) => ({
    data: { items: mocks.pages[page] ?? [], jobColumns: DASHBOARD_JOB_COLUMNS, total: 40 },
    isLoading: false,
    isPlaceholderData: mocks.isPlaceholderData,
    refetch: mocks.refetch,
  }),
}))
vi.mock('./ExtrusionDetailModal', () => ({ ExtrusionDetailModal: () => null }))
vi.mock('./PrecisionCuttingDetailModal', () => ({ PrecisionCuttingDetailModal: () => null }))
vi.mock('./ProductionDetailModal', () => ({ ProductionDetailModal: () => null }))
vi.mock('./TransferDetailModal', () => ({ TransferDetailModal: () => null }))

function renderPage(page = 1) {
  const router = createMemoryRouter([
    { path: '/production-scheduling', element: <App><OrderStatusDashboard /></App> },
  ], { initialEntries: [`/production-scheduling?page=${page}&pageSize=20`] })
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...view, router }
}

function getExportButton(): HTMLElement {
  return screen.getByText('导出当前页').closest('button')!
}

async function exportPage(): Promise<void> {
  const count = mocks.exportExcel.mock.calls.length
  fireEvent.click(getExportButton())
  await waitFor(() => expect(mocks.exportExcel).toHaveBeenCalledTimes(count + 1))
  await waitFor(() => expect(getExportButton()).not.toHaveClass('ant-btn-loading'))
}

async function filterColumn(header: string, value: string): Promise<void> {
  const column = screen.getByRole('columnheader', { name: new RegExp(`^${header}(?:\\s|$)`) })
  fireEvent.click(within(column).getByRole('button', { name: 'filter' }))
  const menu = await screen.findByRole('menu')
  fireEvent.click(within(menu).getByText(value, { exact: true }))
  fireEvent.click(screen.getByRole('button', { name: /OK|确.*定/ }))
}

describe('OrderStatusDashboard current-page export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.role = 'admin'
    mocks.canManageStatus = false
    mocks.isPlaceholderData = false
    mocks.pages = {
      1: createScreenshotDashboardOrders(),
      2: [createDashboardOrder({ id: 'page-2-a', project_no: 'P-20', customer: '客户A' }), createDashboardOrder({ id: 'page-2-b', project_no: 'P-10', customer: '客户B' })],
    }
  })

  it('exports only the loaded page, preserves sorting and switches pages with correct numbering', async () => {
    renderPage(2)
    await exportPage()
    expect(mocks.exportExcel).toHaveBeenLastCalledWith(mocks.pages[2], DASHBOARD_JOB_COLUMNS, 20)
    fireEvent.click(screen.getByRole('columnheader', { name: /项目号/ }))
    await exportPage()
    expect(mocks.exportExcel.mock.calls.at(-1)![0].map((row: OrderStatusDashboardItem) => row.project_no)).toEqual(['P-10', 'P-20'])
    fireEvent.click(screen.getByTitle('1'))
    await exportPage()
    expect(mocks.exportExcel.mock.calls.at(-1)![0]).toHaveLength(5)
    expect(mocks.exportExcel.mock.calls.at(-1)![2]).toBe(0)
    expect(mocks.exportExcel.mock.calls.at(-1)![0].every((row: OrderStatusDashboardItem) => row.id.startsWith('order-'))).toBe(true)
  }, 20000)

  it('exports column-filtered rows and recomputes them after refresh; reset restores the page', async () => {
    renderPage(2)
    await filterColumn('客户', '客户A')
    await exportPage()
    expect(mocks.exportExcel.mock.calls.at(-1)![0].map((row: OrderStatusDashboardItem) => row.id)).toEqual(['page-2-a'])
    expect(mocks.exportExcel.mock.calls.at(-1)![2]).toBe(20)
    mocks.refetch.mockImplementationOnce(async () => {
      mocks.pages[2] = [createDashboardOrder({ id: 'refreshed', project_no: 'NEW', customer: '客户A', order_quantity: 999 })]
    })
    fireEvent.click(screen.getByRole('button', { name: /刷.*新/ }))
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledOnce())
    await waitFor(() => expect(getExportButton()).not.toBeDisabled())
    await exportPage()
    expect(mocks.exportExcel.mock.calls.at(-1)![0][0]).toMatchObject({ id: 'refreshed', order_quantity: 999 })
    fireEvent.click(screen.getByRole('button', { name: /重.*置/ }))
    await exportPage()
    expect(mocks.exportExcel.mock.calls.at(-1)![0]).toHaveLength(5)
    expect(mocks.exportExcel.mock.calls.at(-1)![2]).toBe(0)
  }, 20000)

  it('disables export when a persisted column filter leaves the next page empty', async () => {
    renderPage(2)
    await filterColumn('客户', '客户A')
    fireEvent.click(screen.getByTitle('1'))
    await waitFor(() => expect(getExportButton()).toBeDisabled())
    expect(mocks.exportExcel).not.toHaveBeenCalled()
  }, 20000)

  it('disables export while switching pages and preserves administrator-only access', () => {
    mocks.isPlaceholderData = true
    const view = renderPage()
    expect(getExportButton()).toBeDisabled()
    view.unmount()
    mocks.role = 'employee'
    renderPage()
    expect(screen.queryByRole('button', { name: '导出当前页' })).not.toBeInTheDocument()
  })

  it('submits a filter with Enter and preserves it when switching status tabs', () => {
    const { router } = renderPage(2)

    const closedTab = screen.getByRole('tab', { name: '已结案' })
    expect(screen.getByRole('tab', { name: '生产中' })).toHaveAttribute('aria-selected', 'true')
    const productionPanel = screen.getByRole('tabpanel', { name: '生产中' })
    const projectInput = within(productionPanel).getByRole('textbox', { name: '项目号' })
    fireEvent.change(projectInput, { target: { value: 'P-10' } })
    fireEvent.keyDown(projectInput, { key: 'Enter', code: 'Enter' })
    expect(new URLSearchParams(router.state.location.search).get('projectNo')).toBe('P-10')

    fireEvent.click(closedTab)
    expect(closedTab).toHaveAttribute('aria-selected', 'true')
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('status')).toBe('已结案')
    expect(params.get('page')).toBe('1')
    const closedPanel = screen.getByRole('tabpanel', { name: '已结案' })
    expect(within(closedPanel).getByRole('textbox', { name: '项目号' })).toHaveValue('P-10')
  })

  it('counts only shown orders that can be closed and gates the count by permission', async () => {
    mocks.pages[2][0].completionRate = 100
    const readOnly = renderPage(2)
    expect(screen.queryByText(/本页.*可结案/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^结案$/ })).not.toBeInTheDocument()
    readOnly.unmount()

    mocks.canManageStatus = true
    renderPage(2)
    expect(screen.getByText('本页 1 个订单可结案')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^结案$/ })).toBeInTheDocument()
    await filterColumn('客户', '客户B')
    expect(screen.getByText('本页 0 个订单可结案')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^结案$/ })).not.toBeInTheDocument()
  }, 20000)
})

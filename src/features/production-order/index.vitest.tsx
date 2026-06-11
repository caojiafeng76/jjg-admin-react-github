/* eslint-disable react-refresh/only-export-components */
import { act, cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProductionOrderPage from './index'

const queryState = vi.hoisted(() => ({
  current: {
    data: { items: [], total: 16 },
    isFetching: true,
    isLoading: false,
    isPlaceholderData: false,
  },
}))

const mutation = vi.hoisted(() => ({
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          error: vi.fn(),
          open: vi.fn(),
          success: vi.fn(),
          warning: vi.fn(),
        },
        modal: {
          confirm: vi.fn(),
        },
      }),
    },
  }
})

vi.mock('@/config/access', () => ({
  isAdminRole: () => false,
  isEmployeeSideRole: () => false,
}))

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    employeeProfile: null,
    role: null,
  }),
}))

vi.mock('@/hooks/useTableHeight', () => ({
  useTableHeight: () => ({
    paginationRef: { current: null },
    scrollY: 400,
    tableContainerRef: { current: null },
  }),
}))

vi.mock('@/services/apiAdminManagementPassword', () => ({
  updateAdminManagementPassword: vi.fn(),
  verifyAdminManagementPassword: vi.fn(),
}))

vi.mock('@/services/apiProductionOrders', () => ({
  PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE: 500,
  checkEmployeeOrderExistsOnDate: vi.fn(),
  getProductionOrdersForExportByFiltersChunked: vi.fn(),
  getProductionOrdersForExportChunked: vi.fn(),
}))

vi.mock('@/utils/productionOrderExcel', () => ({
  exportProductionOrdersToExcel: vi.fn(),
}))

vi.mock('@/utils/productionOrderNightSnackExcel', () => ({
  exportProductionOrderNightSnackDetailsToExcel: vi.fn(),
}))

vi.mock('@/ui/AddButton', () => ({ default: () => null }))
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))
vi.mock('@/ui/DeleteButton', () => ({ default: () => null }))
vi.mock('@/ui/EditButton', () => ({ default: () => null }))
vi.mock('@/ui/ExportButton', () => ({ default: () => null }))

vi.mock('../workshop/EmployeeList/useEmployees', () => ({
  useAllEmployees: () => ({ data: [] }),
}))

vi.mock('./ProductionOrderDetail', () => ({ default: () => null }))
vi.mock('./ProductionOrderForm', () => ({ default: () => null }))
vi.mock('./ProductionOrderInlineDetail', () => ({ default: () => null }))
vi.mock('./ProductionOrderList', () => ({ default: () => null }))
vi.mock('./ProductionOrderMobileList', () => ({ default: () => null }))
vi.mock('./ProductionOrderSearch', () => ({ default: () => null }))

vi.mock('./useProductionOrderItems', () => ({
  useAddProductionOrderItem: () => mutation,
  useDeleteProductionOrderItems: () => mutation,
  useUpdateProductionOrderItem: () => mutation,
}))

vi.mock('./useProductionOrders', () => ({
  useBatchUpdateProductionOrders: () => mutation,
  useCreateProductionOrder: () => mutation,
  useDeleteProductionOrders: () => mutation,
  useProductionOrder: () => ({ data: undefined, isLoading: false }),
  useProductionOrders: () => queryState.current,
  useUpdateProductionOrder: () => mutation,
}))

function LocationProbe() {
  const location = useLocation()

  return <output data-testid="location-search">{location.search}</output>
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/production-order?page=2&pageSize=10']}>
        <ProductionOrderPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('ProductionOrderPage pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryState.current = {
      data: { items: [], total: 16 },
      isFetching: true,
      isLoading: false,
      isPlaceholderData: false,
    }
  })

  afterEach(() => {
    cleanup()
  })

  it.each([
    { isFetching: true, isPlaceholderData: false, state: '请求中' },
    { isFetching: false, isPlaceholderData: true, state: '占位数据' },
  ])('在显示$state时保留当前页', async ({ isFetching, isPlaceholderData }) => {
    queryState.current = {
      ...queryState.current,
      isFetching,
      isPlaceholderData,
    }

    renderPage()
    await flushEffects()

    expect(screen.getByTestId('location-search')).toHaveTextContent('page=2')
  })

  it('仅在请求完成且当前页确实为空时返回上一页', async () => {
    queryState.current = {
      ...queryState.current,
      isFetching: false,
      isPlaceholderData: false,
    }

    renderPage()
    await flushEffects()

    expect(screen.getByTestId('location-search')).toHaveTextContent('page=1')
  })
})

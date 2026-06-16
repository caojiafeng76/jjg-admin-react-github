import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import WorkshopOrderList from './index'

const mutation = vi.hoisted(() => ({
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
}))

const tableHeightMock = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  paginationRef: { current: null as HTMLDivElement | null },
  tableContainerRef: { current: null as HTMLDivElement | null },
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

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '无操作权限',
  }),
}))

vi.mock('@/hooks/useTableHeight', () => ({
  useTableHeight: (options: Record<string, unknown>) => {
    tableHeightMock.options = options

    return {
      paginationRef: tableHeightMock.paginationRef,
      rowHeight: 30,
      scrollY: 320,
      tableContainerRef: tableHeightMock.tableContainerRef,
    }
  },
}))

vi.mock('@/services/apiWorkshopOrders', () => ({
  getWorkshopOrderDeleteBlockers: vi.fn(),
}))

vi.mock('@/ui/AddButton', () => ({
  default: () => <button type="button">新增</button>,
}))

vi.mock('@/ui/DeleteButton', () => ({
  default: () => <button type="button">删除</button>,
}))

vi.mock('@/ui/EditButton', () => ({
  default: () => <button type="button">编辑</button>,
}))

vi.mock('@/ui/PrintButton', () => ({
  default: () => <button type="button">打印</button>,
}))

vi.mock('@/ui/AppPagination', () => ({
  default: () => <nav data-testid="workshop-order-pagination">分页</nav>,
}))

vi.mock('./useWorkshopOrders', () => ({
  useBatchUpdateWorkshopOrderStatuses: () => mutation,
  useCreateWorkshopOrder: () => mutation,
  useCreateWorkshopOrdersBatch: () => mutation,
  useDeleteWorkshopOrders: () => mutation,
  useUpdateWorkshopOrder: () => mutation,
  useWorkshopOrderLengths: () => ({ data: [] }),
  useWorkshopOrderModels: () => ({ data: [] }),
  useWorkshopOrderProjectNos: () => ({ data: [] }),
  useWorkshopOrdersList: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
  }),
}))

vi.mock('./usePrintWorkshopOrders', () => ({
  usePrintWorkshopOrders: () => ({
    generatePDF: vi.fn(),
    isPrinting: false,
  }),
}))

vi.mock('./useExportWorkshopOrdersAsExcel', () => ({
  useExportWorkshopOrdersAsExcel: () => ({
    exportAsExcel: vi.fn(),
    isExporting: false,
  }),
}))

vi.mock('./WorkshopOrderTable', () => ({
  default: () => <div data-testid="workshop-order-table" />,
}))

vi.mock('./WorkshopOrderForm', () => ({
  default: () => null,
}))

vi.mock('./WorkshopOrderSearch', () => ({
  default: () => <div data-testid="workshop-order-search" />,
}))

vi.mock('./WorkshopOrderProductionStats', () => ({
  default: () => <div data-testid="workshop-order-production-stats" />,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/workshop-order-list']}>
      <WorkshopOrderList />
    </MemoryRouter>,
  )
}

describe('WorkshopOrderList layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tableHeightMock.options = undefined
    tableHeightMock.paginationRef.current = null
    tableHeightMock.tableContainerRef.current = null
  })

  afterEach(() => {
    cleanup()
  })

  it('clips overflowing table content so the pagination stays visible', () => {
    renderPage()

    const tableSlot = screen.getByTestId('workshop-order-table').parentElement

    expect(screen.queryByText('订单列表')).not.toBeInTheDocument()
    expect(screen.queryByText('共 0 条记录')).not.toBeInTheDocument()
    expect(tableSlot).toHaveClass('overflow-hidden')
    expect(tableHeightMock.options).toMatchObject({
      headerHeight: 30,
      minRowHeight: 30,
      reservePaginationHeight: false,
      targetRowCount: 10,
    })
    expect(tableHeightMock.tableContainerRef.current).toBe(tableSlot)
    expect(screen.getByTestId('workshop-order-pagination')).toBeInTheDocument()
  })
})

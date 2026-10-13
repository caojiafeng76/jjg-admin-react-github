import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import VillaLiftOrderListPage from './index'

const mocks = vi.hoisted(() => ({
  message: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  listArgs: [] as Array<Record<string, unknown>>,
  batchStatus: vi.fn(),
  batchMark: vi.fn(),
  batchDelete: vi.fn(),
  exportAsExcel: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: { ...actual.App, useApp: () => ({ message: mocks.message }) },
  }
})

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => true,
  usePermissions: (keys: string[]) =>
    Object.fromEntries(keys.map((key) => [key, true])),
}))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
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
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))

const ORDERS = [{ id: 'o1', customer: '客户A' }]

vi.mock('./useVillaLiftOrders', () => {
  const idle = { isPending: false, mutateAsync: vi.fn() }

  return {
    useVillaLiftOrders: (args: Record<string, unknown>) => {
      mocks.listArgs.push(args)
      return { data: { orders: ORDERS, count: 1 }, isLoading: false }
    },
    useVillaLiftOrderItems: () => ({ data: [], isLoading: false }),
    useCreateVillaLiftOrder: () => idle,
    useUpdateVillaLiftOrder: () => idle,
    useUpsertVillaLiftOrderItems: () => idle,
    useBatchDeleteVillaLiftOrders: () => ({
      isPending: false,
      mutateAsync: mocks.batchDelete,
    }),
    useBatchUpdateVillaLiftOrdersStatus: () => ({
      isPending: false,
      mutateAsync: mocks.batchStatus,
    }),
    useBatchMarkVillaLiftOrdersDate: () => ({
      isPending: false,
      mutateAsync: mocks.batchMark,
    }),
  }
})

vi.mock('./useExportVillaLiftOrdersAsExcel', () => ({
  useExportVillaLiftOrdersAsExcel: () => ({
    exportAsExcel: mocks.exportAsExcel,
    isExporting: false,
    preloadExportAsExcel: vi.fn(),
  }),
}))

vi.mock('./VillaLiftOrderTable', () => ({
  default: ({
    onSelectionChange,
  }: {
    onSelectionChange: (keys: string[]) => void
  }) => (
    <button type="button" onClick={() => onSelectionChange(['o1'])}>
      选中订单
    </button>
  ),
}))
vi.mock('./VillaLiftOrderForm', () => ({ default: () => null }))

function renderPage() {
  return render(
    <MemoryRouter>
      <VillaLiftOrderListPage />
    </MemoryRouter>,
  )
}

describe('VillaLiftOrderListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.listArgs.length = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('选中订单后显示批量按钮，批量结案调用状态更新', async () => {
    const user = userEvent.setup()
    mocks.batchStatus.mockResolvedValue(undefined)
    renderPage()

    expect(screen.queryByRole('button', { name: /批量结案/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: '选中订单' }))
    await user.click(screen.getByRole('button', { name: /批量结案 \(1\)/ }))

    await waitFor(() =>
      expect(mocks.batchStatus).toHaveBeenCalledWith({
        ids: ['o1'],
        status: 'closed',
      }),
    )
    expect(mocks.message.success).toHaveBeenCalledWith('已结案 1 条订单')
    expect(screen.queryByRole('button', { name: /批量反结案/ })).toBeNull()
  })

  it('标记喷涂完成时写入当天日期', async () => {
    const user = userEvent.setup()
    mocks.batchMark.mockResolvedValue(undefined)
    renderPage()

    await user.click(screen.getByRole('button', { name: '选中订单' }))
    await user.click(screen.getByRole('button', { name: /喷涂完成 \(1\)/ }))

    await waitFor(() =>
      expect(mocks.batchMark).toHaveBeenCalledWith({
        ids: ['o1'],
        field: 'painting_date',
        date: dayjs().format('YYYY-MM-DD'),
      }),
    )
  })

  it('搜索时以输入框内容查询，切换已结案页签清空筛选', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('客户'), ' 客户A ')
    await user.click(screen.getByRole('button', { name: /搜\s*索/ }))

    await waitFor(() =>
      expect(mocks.listArgs.at(-1)).toMatchObject({
        status: 'open',
        customer: '客户A',
      }),
    )

    await user.click(screen.getByRole('tab', { name: '已结案' }))

    await waitFor(() =>
      expect(mocks.listArgs.at(-1)).toMatchObject({
        status: 'closed',
        customer: undefined,
      }),
    )
    expect(
      (screen.getByPlaceholderText('客户') as HTMLInputElement).value,
    ).toBe('')
  })

  it('导出当前列表并提示导出条数', async () => {
    const user = userEvent.setup()
    mocks.exportAsExcel.mockResolvedValue(true)
    renderPage()

    await user.click(screen.getByRole('button', { name: /导出Excel/ }))

    await waitFor(() =>
      expect(mocks.exportAsExcel).toHaveBeenCalledWith(ORDERS),
    )
    expect(mocks.message.success).toHaveBeenCalledWith('已导出 1 条订单')
  })
})

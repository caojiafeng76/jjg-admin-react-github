import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  YOUMAI_FINISHED_GOODS_INVENTORY_PERMISSION_KEY,
  YOUMAI_FINISHED_GOODS_STOCK_IN_PERMISSION_KEY,
} from '../permissions'
import YoumaiFinishedGoodsStockDetailDrawer from './YoumaiFinishedGoodsStockDetailDrawer'

const product = {
  id: 'prod-1',
  material_code: 'YM-001',
  material_name: '优迈踏板',
  model: 'YM-A',
  specification: '100*20*3',
  specific_gravity: 2.71,
}

const inventory = {
  id: 'inv-1',
  product_data_id: 'prod-1',
  material_code: 'YM-001',
  material_name: '优迈踏板',
  model: 'YM-A',
  specification: '100*20*3',
  specific_gravity: 2.71,
  pending_stock_in: 8,
  pending_stock_out: 3,
  current_stock: 20,
  final_stock: 25,
  remarks: '初始备注',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const state = vi.hoisted(() => ({
  stockInLockedProduct: undefined as unknown,
  stockInAllowStatus: undefined as boolean | undefined,
  stockInFinish: undefined as ((values: unknown) => Promise<void>) | undefined,
  createStockIn: vi.fn().mockResolvedValue(undefined),
  adjustProps: undefined as
  | {
    currentStock: number
    initialRemarks: string
    onFinish: (values: unknown) => Promise<void>
  }
  | undefined,
  adjustInventory: vi.fn().mockResolvedValue(undefined),
  denyInventory: false,
  denyStockIn: false,
  viewerDenied: false,
  message: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('antd', () => ({
  Alert: (props: { title?: React.ReactNode }) => <div>{props.title}</div>,
  App: {
    useApp: () => ({ message: state.message }),
  },
  Button: (props: {
    children?: React.ReactNode
    disabled?: boolean
    onClick?: () => void
  }) => (
    <button type="button" disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  ),
  Drawer: (props: { title?: React.ReactNode, children?: React.ReactNode }) => (
    <div>
      <div>{props.title}</div>
      {props.children}
    </div>
  ),
  Modal: (props: {
    title?: React.ReactNode
    children?: React.ReactNode
    open?: boolean
  }) =>
    props.open
      ? (
          <div>
            <div>{props.title}</div>
            {props.children}
          </div>
        )
      : null,
  Tabs: (props: { items?: { key: string, label: React.ReactNode }[] }) => (
    <div>
      {props.items?.map(item => (
        <div key={item.key}>{item.label}</div>
      ))}
    </div>
  ),
  Tooltip: (props: { children?: React.ReactNode }) => props.children,
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: (key: string) => {
    if (state.denyInventory && key === YOUMAI_FINISHED_GOODS_INVENTORY_PERMISSION_KEY)
      return false
    if (state.denyStockIn && key === YOUMAI_FINISHED_GOODS_STOCK_IN_PERMISSION_KEY)
      return false
    return true
  },
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: state.viewerDenied,
    viewerOperationTip: '查看员仅支持只读',
  }),
}))

vi.mock('@/ui/FormErrorAlert', () => ({
  default: (props: { error: unknown }) =>
    props.error ? <div>表单错误提示</div> : null,
}))

vi.mock('./useYoumaiFinishedGoodsDetail', () => ({
  useYoumaiFinishedGoodsInventoryDetail: () => ({
    data: inventory,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('./YoumaiFinishedGoodsRecordsTabs', () => ({
  YoumaiFinishedGoodsStockInRecordsTab: () => <div>入库记录表格</div>,
  YoumaiFinishedGoodsStockOutRecordsTab: () => <div>出库记录表格</div>,
  YoumaiFinishedGoodsAdjustmentRecordsTab: () => <div>调整记录表格</div>,
}))

vi.mock('../FinishedGoodsStockIn/useYoumaiFinishedGoodsStockIn', () => ({
  useCreateYoumaiFinishedGoodsStockIn: () => ({
    isPending: false,
    mutateAsync: state.createStockIn,
  }),
}))

vi.mock('../FinishedGoodsInventory/useYoumaiFinishedGoodsInventory', () => ({
  useAdjustYoumaiFinishedGoodsInventory: () => ({
    isPending: false,
    mutateAsync: state.adjustInventory,
  }),
}))

vi.mock('../FinishedGoodsStockIn/YoumaiFinishedGoodsStockInForm', () => ({
  default: (props: {
    lockedProduct?: unknown
    allowStatusSelect?: boolean
    onFinish: (values: unknown) => Promise<void>
  }) => {
    state.stockInLockedProduct = props.lockedProduct
    state.stockInAllowStatus = props.allowStatusSelect
    state.stockInFinish = props.onFinish
    return <div>入库表单</div>
  },
}))

vi.mock('./YoumaiFinishedGoodsInventoryAdjustForm', () => ({
  default: (props: NonNullable<typeof state.adjustProps>) => {
    state.adjustProps = props
    return <div>调整库存表单</div>
  },
}))

function renderDrawer() {
  return render(
    <YoumaiFinishedGoodsStockDetailDrawer
      open
      product={product}
      onClose={() => {}}
    />,
  )
}

describe('YoumaiFinishedGoodsStockDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.stockInLockedProduct = undefined
    state.stockInAllowStatus = undefined
    state.stockInFinish = undefined
    state.adjustProps = undefined
    state.denyInventory = false
    state.denyStockIn = false
    state.viewerDenied = false
  })

  afterEach(cleanup)

  it('renders inventory cards, record tabs, and omits redundant stock-out creation button', () => {
    renderDrawer()

    expect(screen.getByText('优迈成品库存与流水')).toBeInTheDocument()
    expect(screen.getByText('YM-001 | 优迈踏板')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('入库记录')).toBeInTheDocument()
    expect(screen.getByText('出库记录')).toBeInTheDocument()
    expect(screen.getByText('调整记录')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新建入库' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '调整库存' })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: '新建出库' }),
    ).not.toBeInTheDocument()
  })

  it('quick stock-in locks product, allows status selection, and submits cleanly', async () => {
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '新建入库' }))

    expect(screen.getByText('新建优迈成品入库')).toBeInTheDocument()
    expect(state.stockInLockedProduct).toEqual(product)
    expect(state.stockInAllowStatus).toBe(true)

    await act(async () => {
      await state.stockInFinish?.({
        product_data_id: 'prod-1',
        status: '已审核',
        stock_in_quantity: 12,
        remarks: '补库',
      })
    })

    expect(state.createStockIn).toHaveBeenCalledWith({
      product_data_id: 'prod-1',
      status: '已审核',
      stock_in_quantity: 12,
      remarks: '补库',
    })
    expect(state.message.success).toHaveBeenCalledWith(
      '优迈成品入库创建成功，现有库存已更新',
    )
    expect(screen.queryByText('新建优迈成品入库')).not.toBeInTheDocument()
  })

  it('adjusts current stock directly without creating stock-in records', async () => {
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '调整库存' }))

    expect(screen.getByText('调整优迈成品库存')).toBeInTheDocument()
    expect(state.adjustProps).toMatchObject({
      currentStock: 20,
      initialRemarks: '初始备注',
    })

    await act(async () => {
      await state.adjustProps?.onFinish({
        current_stock: 26,
        remarks: '盘盈调整',
      })
    })

    expect(state.adjustInventory).toHaveBeenCalledWith({
      id: 'inv-1',
      current_stock: 26,
      remarks: '盘盈调整',
    })
    expect(state.createStockIn).not.toHaveBeenCalled()
    expect(state.message.success).toHaveBeenCalledWith('优迈成品库存调整成功')
    expect(screen.queryByText('调整优迈成品库存')).not.toBeInTheDocument()
  })

  it('keeps modal open and renders FormErrorAlert when adjust fails', async () => {
    state.adjustInventory.mockRejectedValueOnce(new Error('保存失败'))
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '调整库存' }))
    await act(async () => {
      await state.adjustProps?.onFinish({ current_stock: 26, remarks: '' })
    })

    expect(screen.getByText('调整优迈成品库存')).toBeInTheDocument()
    expect(screen.getByText('表单错误提示')).toBeInTheDocument()
    expect(state.message.success).not.toHaveBeenCalled()
  })

  it('disables buttons according to page permissions and viewer guard', () => {
    state.denyInventory = true
    state.denyStockIn = true
    renderDrawer()

    expect(screen.getByRole('button', { name: '新建入库' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '调整库存' })).toBeDisabled()
  })
})

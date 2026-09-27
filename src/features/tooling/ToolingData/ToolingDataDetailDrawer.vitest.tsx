import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ToolingData } from '@/services/apiToolingData'

import ToolingDataDetailDrawer from './ToolingDataDetailDrawer'

const state = vi.hoisted(() => ({
  permissions: {} as Record<string, boolean>,
  viewerDenied: false,
  stockInLocked: false,
  stockInInitialValues: undefined as Record<string, unknown> | undefined,
  stockInFinish: undefined as ((values: unknown) => void) | undefined,
  stockOutLocked: false,
  stockOutInitialValues: undefined as Record<string, unknown> | undefined,
  createStockIn: vi.fn().mockResolvedValue(undefined),
  createStockOut: vi.fn().mockResolvedValue(undefined),
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
  Drawer: (props: { title?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      <div>{props.title}</div>
      {props.children}
    </div>
  ),
  FormInstance: class {},
  Modal: (props: {
    title?: React.ReactNode
    children?: React.ReactNode
    open?: boolean
  }) =>
    props.open ? (
      <div>
        <div>{props.title}</div>
        {props.children}
      </div>
    ) : null,
  Tabs: (props: { items?: { key: string; label: React.ReactNode }[] }) => (
    <div>
      {props.items?.map((item) => (
        <div key={item.key}>{item.label}</div>
      ))}
    </div>
  ),
  Tooltip: (props: { children?: React.ReactNode }) => props.children,
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: (key: string) => state.permissions[key] === true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: state.viewerDenied,
    viewerOperationTip: '查看员仅可查看数据',
  }),
}))

vi.mock('@/features/production-order/useMachineEquipmentOptions', () => ({
  useMachineEquipmentOptions: () => ({ data: [], isLoading: false }),
}))

vi.mock('./useToolingDataDetail', () => ({
  useToolingInventoryDetail: () => ({
    data: {
      pending_stock_in: 3,
      current_stock: 12,
      pending_stock_out: 2,
      final_stock: 13,
      remarks: '',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('./ToolingStockRecordsTabs', () => ({
  ToolingStockInRecordsTab: () => <div>入库记录表格</div>,
  ToolingStockOutRecordsTab: () => <div>出库记录表格</div>,
}))

vi.mock('../ToolingStockIn/ToolingStockInForm', () => ({
  default: (props: {
    lockTooling?: boolean
    initialValues?: Record<string, unknown>
    onFinish: (values: unknown) => void
  }) => {
    state.stockInLocked = props.lockTooling === true
    state.stockInInitialValues = props.initialValues
    state.stockInFinish = props.onFinish

    return <div>入库表单</div>
  },
}))

vi.mock('../ToolingStockOut/ToolingStockOutForm', () => ({
  default: (props: {
    lockTooling?: boolean
    initialValues?: Record<string, unknown>
  }) => {
    state.stockOutLocked = props.lockTooling === true
    state.stockOutInitialValues = props.initialValues

    return <div>出库表单</div>
  },
}))

vi.mock('../ToolingStockIn/useToolingStockIn', () => ({
  useCreateToolingStockIn: () => ({
    isPending: false,
    mutateAsync: state.createStockIn,
  }),
}))

vi.mock('../ToolingStockOut/useToolingStockOut', () => ({
  useCreateToolingStockOut: () => ({
    isPending: false,
    mutateAsync: state.createStockOut,
  }),
}))

const record: ToolingData = {
  id: 'tool-1',
  tool_code: 'T-001',
  tool_name: '铣刀',
  tool_spec: '10mm',
  material: '硬质合金',
  unit_price: 12.5,
  usage: '加工',
  remarks: '常用',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function renderDrawer() {
  return render(
    <ToolingDataDetailDrawer open record={record} onClose={vi.fn()} />,
  )
}

describe('ToolingDataDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.permissions = {}
    state.viewerDenied = false
    state.stockInLocked = false
    state.stockInInitialValues = undefined
    state.stockInFinish = undefined
    state.stockOutLocked = false
    state.stockOutInitialValues = undefined
  })

  afterEach(() => cleanup())

  it('仅在拥有对应页面权限时展示库存与出入库区域', () => {
    state.permissions = { 'page:tooling-inventory': true }

    renderDrawer()

    expect(screen.getByText('现有库存')).toBeInTheDocument()
    expect(screen.getByText('13.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '新建入库' })).toBeNull()
    expect(screen.queryByRole('button', { name: '新建出库' })).toBeNull()
    expect(screen.queryByText('入库记录')).toBeNull()
    expect(screen.queryByText('出库记录')).toBeNull()
    expect(
      screen.getByText('无刀具入库 / 出库页面权限，暂不能查看出入库记录'),
    ).toBeInTheDocument()
  })

  it('快捷建单锁定当前刀具，提交后走入库创建链路', async () => {
    state.permissions = {
      'page:tooling-stock-in': true,
      'feature:tooling.manage': true,
    }

    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '新建入库' }))

    expect(screen.getByText('入库表单')).toBeInTheDocument()
    expect(state.stockInLocked).toBe(true)
    expect(state.stockInInitialValues?.tooling_data_id).toBe('tool-1')

    state.stockInFinish?.({
      tooling_data_id: 'tool-1',
      status: '待审核',
      stock_in_quantity: 5,
      remarks: '',
    })

    await vi.waitFor(() =>
      expect(state.createStockIn).toHaveBeenCalledWith({
        tooling_data_id: 'tool-1',
        status: '待审核',
        stock_in_quantity: 5,
        remarks: '',
      }),
    )
  })

  it('查看员与无操作权限时禁用快捷建单按钮', () => {
    state.permissions = { 'page:tooling-stock-in': true }
    state.viewerDenied = true

    renderDrawer()

    expect(screen.getByRole('button', { name: '新建入库' })).toBeDisabled()
  })
})

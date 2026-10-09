import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import JintanPartsDataDetailDrawer from './JintanPartsDataDetailDrawer'

const record = {
  id: 'part-1',
  part_name: '螺丝',
  specification: 'M6*16',
  material: '不锈钢',
  supplier: '南浔螺丝店',
  remarks: '',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const inventory = {
  id: 'inv-1',
  part_data_id: 'part-1',
  part_name: '螺丝',
  specification: 'M6*16',
  material: '不锈钢',
  supplier: '南浔螺丝店',
  quantity: 20,
  remarks: '',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const state = vi.hoisted(() => ({
  stockInQuick: undefined as unknown,
  stockInFinish: undefined as ((values: unknown) => void) | undefined,
  stockOutQuick: undefined as unknown,
  stockOutFinish: undefined as ((values: unknown) => void) | undefined,
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

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '无操作权限',
  }),
}))

vi.mock('./useJintanPartsDataDetail', () => ({
  useJintanPartsInventoryDetail: () => ({
    data: inventory,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('./JintanPartsStockRecordsTabs', () => ({
  JintanPartsStockInRecordsTab: () => <div>入库记录表格</div>,
  JintanPartsStockOutRecordsTab: () => <div>出库记录表格</div>,
}))

vi.mock('../PartsStockIn/useJintanPartsStockIn', () => ({
  useCreateJintanPartsStockIn: () => ({
    isPending: false,
    mutateAsync: state.createStockIn,
  }),
}))
vi.mock('../PartsStockOut/useJintanPartsStockOut', () => ({
  useCreateJintanPartsStockOut: () => ({
    isPending: false,
    mutateAsync: state.createStockOut,
  }),
}))

vi.mock('../PartsStockIn/JintanPartsStockInForm', () => ({
  default: (props: {
    quickInventory?: unknown
    onFinish: (values: unknown) => void
  }) => {
    state.stockInQuick = props.quickInventory
    state.stockInFinish = props.onFinish
    return <div>入库表单</div>
  },
}))
vi.mock('../PartsStockOut/JintanPartsStockOutForm', () => ({
  default: (props: {
    quickInventory?: unknown
    onFinish: (values: unknown) => void
  }) => {
    state.stockOutQuick = props.quickInventory
    state.stockOutFinish = props.onFinish
    return <div>出库表单</div>
  },
}))

function renderDrawer() {
  return render(
    <JintanPartsDataDetailDrawer open record={record} onClose={() => {}} />,
  )
}

describe('JintanPartsDataDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.stockInQuick = undefined
    state.stockInFinish = undefined
    state.stockOutQuick = undefined
    state.stockOutFinish = undefined
  })

  afterEach(() => cleanup())

  it('renders the record header, inventory quantity and record tabs', () => {
    renderDrawer()

    expect(screen.getByText('配件详情')).toBeInTheDocument()
    expect(screen.getByText('螺丝 / M6*16')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('入库记录')).toBeInTheDocument()
    expect(screen.getByText('出库记录')).toBeInTheDocument()
  })

  it('quick stock-in locks the inventory and submits through the create mutation', async () => {
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '新建入库' }))

    expect(screen.getByText('新建配件入库')).toBeInTheDocument()
    expect(state.stockInQuick).toMatchObject({ id: 'inv-1', quantity: 20 })

    state.stockInFinish?.({ inventory_id: 'inv-1', quantity: 5, remarks: '' })
    await vi.waitFor(() =>
      expect(state.createStockIn).toHaveBeenCalledWith({
        inventory_id: 'inv-1',
        quantity: 5,
        remarks: '',
      }),
    )
  })

  it('quick stock-out locks the inventory and submits through the create mutation', async () => {
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '新建出库' }))

    expect(screen.getByText('新建配件出库')).toBeInTheDocument()
    expect(state.stockOutQuick).toMatchObject({ id: 'inv-1', quantity: 20 })

    state.stockOutFinish?.({ inventory_id: 'inv-1', quantity: 2, remarks: '' })
    await vi.waitFor(() =>
      expect(state.createStockOut).toHaveBeenCalledWith({
        inventory_id: 'inv-1',
        quantity: 2,
        remarks: '',
      }),
    )
  })
})

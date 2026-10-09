import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import JintanProfilesDataDetailDrawer from './JintanProfilesDataDetailDrawer'

const record = {
  id: 'profile-1',
  profile_model: '140U',
  profile_name: '立柱',
  specification: '3米',
  material: '6063铝合金',
  remarks: '',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const inventory = {
  id: 'inv-1',
  profile_data_id: 'profile-1',
  profile_model: '140U',
  profile_name: '立柱',
  specification: '3米',
  material: '6063铝合金',
  quantity: 30,
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

vi.mock('./useJintanProfilesDataDetail', () => ({
  useJintanProfilesInventoryDetail: () => ({
    data: inventory,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('./JintanProfilesStockRecordsTabs', () => ({
  JintanProfilesStockInRecordsTab: () => <div>入库记录表格</div>,
  JintanProfilesStockOutRecordsTab: () => <div>出库记录表格</div>,
}))

vi.mock('../ProfilesStockIn/useJintanProfilesStockIn', () => ({
  useCreateJintanProfilesStockIn: () => ({
    isPending: false,
    mutateAsync: state.createStockIn,
  }),
}))
vi.mock('../ProfilesStockOut/useJintanProfilesStockOut', () => ({
  useCreateJintanProfilesStockOut: () => ({
    isPending: false,
    mutateAsync: state.createStockOut,
  }),
}))

vi.mock('../ProfilesStockIn/JintanProfilesStockInForm', () => ({
  default: (props: {
    quickInventory?: unknown
    onFinish: (values: unknown) => void
  }) => {
    state.stockInQuick = props.quickInventory
    state.stockInFinish = props.onFinish
    return <div>入库表单</div>
  },
}))
vi.mock('../ProfilesStockOut/JintanProfilesStockOutForm', () => ({
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
    <JintanProfilesDataDetailDrawer open record={record} onClose={() => {}} />,
  )
}

describe('JintanProfilesDataDetailDrawer', () => {
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

    expect(screen.getByText('型材详情')).toBeInTheDocument()
    expect(screen.getByText('140U / 立柱 / 3米')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('入库记录')).toBeInTheDocument()
    expect(screen.getByText('出库记录')).toBeInTheDocument()
  })

  it('quick stock-in locks the inventory and submits through the create mutation', async () => {
    renderDrawer()

    fireEvent.click(screen.getByRole('button', { name: '新建入库' }))

    expect(screen.getByText('新建型材入库')).toBeInTheDocument()
    expect(state.stockInQuick).toMatchObject({ id: 'inv-1', quantity: 30 })

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

    expect(screen.getByText('新建型材出库')).toBeInTheDocument()
    expect(state.stockOutQuick).toMatchObject({ id: 'inv-1', quantity: 30 })

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

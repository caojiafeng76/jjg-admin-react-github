import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import WorkshopMiscMaterialsDataPage from './index'

const records = [
  {
    id: 'material-1',
    model: '196-A01',
    customer_model: 'C-196',
    specification: '2mm',
    category: '铝材',
    remarks: '',
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
  },
]

const messages = vi.hoisted(() => ({
  warning: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
const createMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
}))
const updateMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
}))
const deleteMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
}))
const formState = vi.hoisted(() => ({
  initialValues: undefined as unknown,
  onFinish: undefined as
    | ((values: Record<string, unknown>) => Promise<void>)
    | undefined,
}))
const detailState = vi.hoisted(() => ({ record: undefined as unknown }))

vi.mock('antd', () => ({
  App: { useApp: () => ({ message: messages }) },
  Button: (props: Record<string, any>) => (
    <button type="button" disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  ),
  Tooltip: (props: { children: React.ReactNode }) => props.children,
  Modal: (props: Record<string, any>) =>
    props.open
      ? (
          <div>
            <div>{props.title}</div>
            {props.children}
          </div>
        )
      : null,
}))

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '无操作权限',
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
vi.mock('@/services/apiWorkshopMiscMaterialsData', () => ({
  getWorkshopMiscMaterialsDataForExport: vi.fn(),
}))
vi.mock('@/ui/AddButton', () => ({
  default: (props: Record<string, any>) => (
    <button type="button" onClick={props.handleCreate}>
      新增
    </button>
  ),
}))
vi.mock('@/ui/EditButton', () => ({
  default: (props: Record<string, any>) => (
    <button type="button" onClick={props.handleEdit}>
      编辑
    </button>
  ),
}))
vi.mock('@/ui/DeleteButton', () => ({
  default: (props: Record<string, any>) => (
    <button type="button" onClick={props.onConfirm}>
      删除
    </button>
  ),
}))
vi.mock('@/ui/ExportButton', () => ({ default: () => null }))
vi.mock('@/ui/ExcelImportModal', () => ({ default: () => null }))
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))
vi.mock('@/ui/FormErrorAlert', () => ({ default: () => null }))
vi.mock('@/ui/TableState', () => ({
  TableState: (props: { children: React.ReactNode }) => props.children,
}))
vi.mock('../WorkshopMiscMaterialsSearch', () => ({ default: () => null }))
vi.mock('./WorkshopMiscMaterialsDataTable', () => ({
  default: (props: {
    onSelect: (keys: React.Key[]) => void
    onOpenDetail?: (record: unknown) => void
  }) => (
    <>
      <button type="button" onClick={() => props.onSelect(['material-1'])}>
        选择记录
      </button>
      <button type="button" onClick={() => props.onOpenDetail?.(records[0])}>
        查看
      </button>
    </>
  ),
}))
vi.mock('./WorkshopMiscMaterialsDataForm', () => ({
  default: (props: {
    initialValues?: unknown
    onFinish: (values: Record<string, unknown>) => Promise<void>
  }) => {
    formState.initialValues = props.initialValues
    formState.onFinish = props.onFinish
    return null
  },
}))
vi.mock('./WorkshopMiscMaterialsDataDetailDrawer', () => ({
  default: (props: { record?: unknown }) => {
    detailState.record = props.record
    return <div>材料详情抽屉</div>
  },
}))
vi.mock('./useWorkshopMiscMaterialsData', () => ({
  useCreateWorkshopMiscMaterialsData: () => createMutation,
  useUpdateWorkshopMiscMaterialsData: () => updateMutation,
  useDeleteWorkshopMiscMaterialsData: () => deleteMutation,
  useImportWorkshopMiscMaterialsData: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useWorkshopMiscMaterialsDataList: () => ({
    data: { items: records, total: 1 },
    isLoading: false,
  }),
}))

const values = {
  model: '196-A02',
  customer_model: 'C-196',
  specification: '3mm',
  category: '铝材',
  remarks: '',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/workshop-misc-materials-data']}>
      <WorkshopMiscMaterialsDataPage />
    </MemoryRouter>,
  )
}

describe('车间杂项材料资料页', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    formState.initialValues = undefined
    formState.onFinish = undefined
  })

  afterEach(() => cleanup())

  it('新建走 create mutation 并提示成功', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('新建材料资料')).toBeInTheDocument()
    expect(formState.initialValues).toBeUndefined()

    await formState.onFinish?.(values)
    expect(createMutation.mutateAsync).toHaveBeenCalledWith(values)
    expect(messages.success).toHaveBeenCalledWith('材料资料创建成功')
  })

  it('编辑带出选中记录并走 update mutation', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '选择记录' }))
    fireEvent.click(screen.getByRole('button', { name: '编辑' }))

    expect(screen.getByText('编辑材料资料')).toBeInTheDocument()
    expect(formState.initialValues).toEqual(records[0])

    await formState.onFinish?.(values)
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'material-1',
      values,
    })
    expect(createMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('复制新增带出选中记录但走 create mutation', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '复制新增' }))
    expect(messages.warning).toHaveBeenCalledWith('请选择一条数据进行复制新增')

    fireEvent.click(screen.getByRole('button', { name: '选择记录' }))
    fireEvent.click(screen.getByRole('button', { name: '复制新增' }))
    expect(screen.getByText('复制新增材料资料')).toBeInTheDocument()

    await formState.onFinish?.(values)
    expect(createMutation.mutateAsync).toHaveBeenCalledWith(values)
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('删除选中记录；删除失败时提示中文原因', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '选择记录' }))
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    await vi.waitFor(() =>
      expect(deleteMutation.mutateAsync).toHaveBeenCalledWith(['material-1']),
    )
    expect(messages.success).toHaveBeenCalledWith('材料资料删除成功')

    deleteMutation.mutateAsync.mockRejectedValueOnce(
      new Error('已有出入库记录，无法删除'),
    )
    fireEvent.click(screen.getByRole('button', { name: '选择记录' }))
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    await vi.waitFor(() =>
      expect(messages.error).toHaveBeenCalledWith('已有出入库记录，无法删除'),
    )
  })

  it('点查看打开详情抽屉', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '查看' }))

    expect(screen.getByText('材料详情抽屉')).toBeInTheDocument()
    expect(detailState.record).toEqual(records[0])
  })
})

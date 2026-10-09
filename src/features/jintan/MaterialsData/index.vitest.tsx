import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import JintanMaterialsDataPage from './index'

const records = [
  {
    id: 'material-1',
    material_model: '140U',
    material_name: '横梁',
    specification: '2米',
    material: '6063铝合金',
    remarks: '',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
]

const messages = vi.hoisted(() => ({ warning: vi.fn() }))
const createMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
}))
const updateMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
}))
const formState = vi.hoisted(() => ({
  initialValues: undefined as unknown,
  onFinish: undefined as
    ((values: Record<string, unknown>) => void) | undefined,
}))

vi.mock('antd', () => ({
  App: {
    useApp: () => ({
      message: { ...messages, error: vi.fn(), success: vi.fn() },
    }),
  },
  Button: (props: Record<string, any>) => (
    <button type="button" disabled={props.disabled} onClick={props.onClick}>
      {props.children}
    </button>
  ),
  FormInstance: class {},
  Tooltip: (props: { children: React.ReactNode }) => props.children,
  Modal: (props: Record<string, any>) =>
    props.open ? (
      <div>
        <div>{props.title}</div>
        <button type="button" onClick={props.onOk}>
          提交
        </button>
        {props.children}
      </div>
    ) : null,
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
vi.mock('@/services/apiJintanMaterialsData', () => ({
  getJintanMaterialsDataForExport: vi.fn(),
}))
vi.mock('@/ui/AddButton', () => ({
  default: (props: Record<string, any>) => (
    <button type="button" onClick={props.handleCreate}>
      新增
    </button>
  ),
}))
vi.mock('@/ui/EditButton', () => ({
  default: () => <button type="button">编辑</button>,
}))
vi.mock('@/ui/DeleteButton', () => ({
  default: () => <button type="button">删除</button>,
}))
vi.mock('@/ui/ExportButton', () => ({
  default: () => <button type="button">导出</button>,
}))
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))
vi.mock('./JintanMaterialsDataExcelImport', () => ({ default: () => null }))
vi.mock('./JintanMaterialsDataSearch', () => ({ default: () => null }))
vi.mock('./JintanMaterialsDataTable', () => ({
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
vi.mock('./JintanMaterialsDataForm', () => ({
  default: (props: {
    initialValues?: unknown
    onFinish: (values: Record<string, unknown>) => void
  }) => {
    formState.initialValues = props.initialValues
    formState.onFinish = props.onFinish
    return null
  },
}))
const detailState = vi.hoisted(() => ({
  record: undefined as unknown,
}))
vi.mock('./JintanMaterialsDataDetailDrawer', () => ({
  default: (props: { record?: unknown }) => {
    detailState.record = props.record
    return <div>素材详情抽屉</div>
  },
}))
vi.mock('./useJintanMaterialsData', () => ({
  useCreateJintanMaterialsData: () => createMutation,
  useDeleteJintanMaterialsData: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useImportJintanMaterialsData: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useJintanMaterialsDataList: () => ({
    data: { items: records, total: 1 },
    isLoading: false,
  }),
  useUpdateJintanMaterialsData: () => updateMutation,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/jintan-materials-data']}>
      <JintanMaterialsDataPage />
    </MemoryRouter>,
  )
}

describe('JintanMaterialsDataPage copy create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    formState.initialValues = undefined
    formState.onFinish = undefined
  })

  afterEach(() => cleanup())

  it('warns when copy create does not have exactly one selected row', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '复制新增' }))

    expect(messages.warning).toHaveBeenCalledWith('请选择一条数据进行复制新增')
  })

  it('opens a create form with copied values and submits through create mutation', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '选择记录' }))
    fireEvent.click(screen.getByRole('button', { name: '复制新增' }))

    expect(screen.getByText('复制新增金檀木业素材资料')).toBeInTheDocument()
    expect(formState.initialValues).toEqual(records[0])

    formState.onFinish?.({ ...records[0], id: undefined })
    await vi.waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalled(),
    )
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('opens the detail drawer with the clicked record', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '查看' }))

    expect(screen.getByText('素材详情抽屉')).toBeInTheDocument()
    expect(detailState.record).toEqual(records[0])
  })
})

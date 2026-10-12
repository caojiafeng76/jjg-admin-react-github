import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import YoumaiProductDataPage from './index'

const records = [
  {
    id: 'product-1',
    material_code: 'YM-001',
    material_name: '优迈物料',
    model: 'A1',
    specification: '100*100',
    specific_gravity: 1.234,
    remarks: '常用',
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
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))
vi.mock('./YoumaiProductDataExcelImport', () => ({ default: () => null }))
vi.mock('./YoumaiProductDataSearch', () => ({ default: () => null }))
vi.mock('./YoumaiProductDataTable', () => ({
  default: (props: { onSelect: (keys: React.Key[]) => void }) => (
    <button type="button" onClick={() => props.onSelect(['product-1'])}>
      选择记录
    </button>
  ),
}))
vi.mock('./YoumaiProductDataForm', () => ({
  default: (props: {
    initialValues?: unknown
    onFinish: (values: Record<string, unknown>) => void
  }) => {
    formState.initialValues = props.initialValues
    formState.onFinish = props.onFinish
    return null
  },
}))
vi.mock('./useYoumaiProductData', () => ({
  useCreateYoumaiProductData: () => createMutation,
  useDeleteYoumaiProductData: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useImportYoumaiProductData: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useUpdateYoumaiProductData: () => updateMutation,
  useYoumaiProductDataList: () => ({
    data: { items: records, total: 1 },
    isLoading: false,
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/youmai-product-data']}>
      <YoumaiProductDataPage />
    </MemoryRouter>,
  )
}

describe('YoumaiProductDataPage copy create', () => {
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

    expect(screen.getByText('复制新增优迈货品资料')).toBeInTheDocument()
    expect(formState.initialValues).toEqual(records[0])

    formState.onFinish?.({ ...records[0], id: undefined })
    await vi.waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalled(),
    )
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled()
  })
})

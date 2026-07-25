import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SpecList from './index'

const createSyneySpecMock = vi.hoisted(() => vi.fn())

vi.mock('@services/apiSyneySpecs', () => ({
  createSyneySpec: createSyneySpecMock,
}))

vi.mock('@/hooks/useTableHeight', () => ({
  useTableHeight: () => ({
    paginationRef: { current: null },
    scrollY: 400,
    tableContainerRef: { current: null },
  }),
}))

vi.mock('@ui/AddButton', () => ({
  default: ({ handleCreate }: { handleCreate: () => void }) => (
    <button type="button" onClick={handleCreate}>
      添加
    </button>
  ),
}))

vi.mock('@ui/AppPagination', () => ({ default: () => null }))
vi.mock('@ui/DeleteButton', () => ({ default: () => null }))
vi.mock('@ui/EditButton', () => ({ default: () => null }))
vi.mock('./PartNoInput', () => ({ default: () => null }))
vi.mock('./SpecTable', () => ({ default: () => null }))

vi.mock('./useDeleteSyneySpecs', () => ({
  useDeleteSyneySpecs: () => ({
    deleteSyneySpecs: vi.fn(),
    isDeleting: false,
  }),
}))

vi.mock('./useSyneySpecs', () => ({
  useSyneySpecs: () => ({
    count: 0,
    isLoading: false,
    syneySpecs: [],
  }),
}))

vi.mock('./useUpdateSyneySpec', () => ({
  useUpdateSyneySpec: () => ({
    isUpdating: false,
    updateSyneySpec: vi.fn(),
  }),
}))

function createTree(queryClient: QueryClient): ReactElement {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/syney-spec-list']}>
            <SpecList />
          </MemoryRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const view = render(createTree(queryClient))

  return view
}

async function fillValidSpecForm(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(await screen.findByLabelText('件号'), 'ULW-REF-FIRST')
  await user.type(screen.getByLabelText('名称'), '首提交流程')
  await user.type(screen.getByLabelText('规格'), '1000型 铝合金')
  await user.type(screen.getByLabelText('参数'), '1525*550')
}

describe('SpecList create form', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSyneySpecMock.mockResolvedValue({
      ParamSpec: '1525*550',
      PartName: '首提交流程',
      PartNo: 'ULW-REF-FIRST',
      Spec: '1000型 铝合金',
      Unit: null,
      id: 1,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('submits the create mutation on the first OK click after opening', async () => {
    // Given: a freshly rendered list whose create modal has never mounted.
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '添加' }))
    await fillValidSpecForm(user)

    // When: the user clicks OK once.
    await user.click(screen.getByRole('button', { name: '确 定' }))

    // Then: the create request starts with the entered payload.
    await waitFor(() => {
      expect(createSyneySpecMock).toHaveBeenCalledOnce()
    })
    expect(createSyneySpecMock.mock.calls[0]?.[0]).toEqual({
      ParamSpec: '1525*550',
      PartName: '首提交流程',
      PartNo: 'ULW-REF-FIRST',
      Spec: '1000型 铝合金',
    })
  })

  it('shows an error message when the create request is rejected', async () => {
    // Given: a mounted create form and a rejected backend request.
    const user = userEvent.setup()
    createSyneySpecMock.mockRejectedValueOnce(
      new Error('duplicate part number'),
    )
    renderPage()
    await user.click(screen.getByRole('button', { name: '添加' }))
    await fillValidSpecForm(user)

    // When: the user submits the valid form.
    await user.click(screen.getByRole('button', { name: '确 定' }))

    // Then: the request runs and its configured error feedback is visible.
    await waitFor(() => {
      expect(createSyneySpecMock).toHaveBeenCalledOnce()
    })
    expect(await screen.findByText('创建规格失败')).toBeInTheDocument()
  })
})

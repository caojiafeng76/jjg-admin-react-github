import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EmployeeList from './index'

const appMock = vi.hoisted(() => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  modal: {
    confirm: vi.fn(),
    warning: vi.fn(),
  },
}))

const mutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => appMock,
    },
  }
})

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
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

vi.mock('./useEmployees', () => ({
  useEmployeesList: () => ({
    data: {
      items: [
        { id: 'e1', name: '张三', auth_user_id: null },
        { id: 'e2', name: '李四', auth_user_id: 'u2' },
      ],
      total: 2,
    },
    isFetching: false,
  }),
  useEmployeeAuthEmail: () => ({ data: undefined, isFetching: false }),
  useCreateEmployee: () => mutation,
  useUpdateEmployee: () => mutation,
  useDeleteEmployees: () => mutation,
  useCreateEmployeeAuthAccount: () => mutation,
  useResetEmployeeAuthPassword: () => mutation,
  useUnbindEmployeeAuthAccount: () => mutation,
  useRebindEmployeeAuthAccount: () => mutation,
}))

vi.mock('./EmployeeTable', () => ({
  default: ({ onSelect }: { onSelect: (keys: string[]) => void }) => (
    <div>
      <button type="button" onClick={() => onSelect(['e1'])}>
        选中张三
      </button>
      <button type="button" onClick={() => onSelect(['e2'])}>
        选中李四
      </button>
    </div>
  ),
}))

vi.mock('./EmployeeSearch', () => ({ default: () => null }))
vi.mock('./EmployeeForm', () => ({ default: () => null }))
vi.mock('./EmployeeAuthAccountForm', () => ({
  default: ({ employee }: { employee: { name: string } }) => (
    <div>开通账号表单：{employee.name}</div>
  ),
}))
vi.mock('./EmployeeResetPasswordForm', () => ({ default: () => null }))
vi.mock('./EmployeeRebindAccountForm', () => ({ default: () => null }))
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <EmployeeList />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EmployeeList 账号管理操作', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('未选择员工时解绑账号提示选择一条数据', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /解绑账号/ }))

    expect(appMock.message.warning).toHaveBeenCalledWith(
      '请选择一条员工数据进行操作',
    )
    expect(appMock.modal.confirm).not.toHaveBeenCalled()
  })

  it('选中未绑定员工可打开开通账号弹窗，但不能重置密码', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '选中张三' }))
    await user.click(screen.getByRole('button', { name: /重置密码/ }))
    expect(appMock.message.warning).toHaveBeenCalledWith(
      '该员工尚未绑定账号，无法重置密码',
    )

    await user.click(screen.getByRole('button', { name: /为现有员工开通账号/ }))
    expect(await screen.findByText('开通账号表单：张三')).toBeTruthy()
  })

  it('选中已绑定员工时不能重复开通，解绑弹出确认框', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '选中李四' }))
    await user.click(screen.getByRole('button', { name: /为现有员工开通账号/ }))
    expect(appMock.message.warning).toHaveBeenCalledWith(
      '该员工已绑定账号，如需更换请使用重新绑定或先解绑',
    )

    await user.click(screen.getByRole('button', { name: /解绑账号/ }))
    expect(appMock.modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: '解绑员工账号' }),
    )
  })

  it('未选择员工时批量开通账号提示先选择', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /批量开通账号/ }))

    expect(appMock.message.warning).toHaveBeenCalledWith(
      '请先选择要批量开通账号的员工',
    )
  })
})

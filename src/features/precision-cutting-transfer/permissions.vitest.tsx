import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import MaterialTransferPage from './index'

const state = vi.hoisted(() => ({
  role: 'viewer',
  permissions: {} as Record<string, boolean>,
}))
const auth = () => ({ role: state.role, user: { email: 'test@example.com' } })
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => auth() }))
vi.mock('@/contexts', () => ({
  useAuth: () => auth(),
  usePermissionContext: () => ({
    permissions: state.permissions,
    can: (key: string) => state.permissions[key] === true,
  }),
}))
vi.mock('@/hooks/useTableHeight', () => ({ useTableHeight: () => ({}) }))
vi.mock('@/services/apiPrecisionCuttingTransfers', () => ({
  getPrecisionCuttingTransfersForExport: vi.fn(),
}))
vi.mock('./useMaterialTransfers', () => ({
  usePrecisionCuttingTransfers: () => ({ data: { items: [], total: 0 } }),
  useCreatePrecisionCuttingTransfer: () => ({}),
  useUpdatePrecisionCuttingTransfer: () => ({}),
  useDeletePrecisionCuttingTransfers: () => ({}),
  useBatchUpdatePrecisionCuttingTransfers: () => ({}),
}))
vi.mock('./MaterialTransferSearch', () => ({ default: () => null }))
vi.mock('./MaterialTransferDetail', () => ({
  default: ({ editDisabled }: { editDisabled: boolean }) => (
    <button disabled={editDisabled}>详情编辑</button>
  ),
}))
vi.mock('./MaterialTransferTable', () => ({
  default: ({ emptyAction }: { emptyAction: ReactNode }) => emptyAction,
}))
vi.mock('./MaterialTransferForm', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div>转移单表单</div> : null,
}))
vi.mock('@/ui/AppPagination', () => ({ default: () => null }))

afterEach(cleanup)
beforeEach(() => {
  state.role = 'viewer'
  state.permissions = { 'page:precision-cutting-transfer': true }
})

function renderPage(): void {
  render(
    <MemoryRouter>
      <App>
        <MaterialTransferPage />
      </App>
    </MemoryRouter>,
  )
}

function expectOperationsDisabled(disabled: boolean): void {
  for (const name of [
    /添\s*加/,
    /^编\s*辑$/,
    /删\s*除/,
    '批量审核',
    '批量反审核',
    '详情编辑',
    '导出当前筛选结果',
  ]) {
    for (const button of screen.getAllByRole('button', { name })) {
      if (disabled) expect(button).toBeDisabled()
      else expect(button).toBeEnabled()
    }
  }
}

describe('精切转移单单独授权', () => {
  it('页面权限不会解除普通查看员的只读限制', () => {
    renderPage()
    expectOperationsDisabled(true)
  })
  it('全部操作授权解除查看员的所有操作入口限制', () => {
    state.permissions['feature:precision-cutting-transfer.manage'] = true
    renderPage()
    expectOperationsDisabled(false)
    fireEvent.click(screen.getAllByRole('button', { name: /添\s*加/ })[0])
    expect(screen.getByText('转移单表单')).toBeInTheDocument()
  })
  it('其他模块的操作授权不能解除精切转移单只读限制', () => {
    state.permissions['feature:tooling.manage'] = true
    renderPage()
    expectOperationsDisabled(true)
  })
  it('保留原有非查看员的操作能力', () => {
    state.role = 'precision_cutting_admin'
    renderPage()
    expectOperationsDisabled(false)
  })
})

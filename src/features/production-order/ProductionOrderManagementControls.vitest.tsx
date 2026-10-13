/* eslint-disable react-refresh/only-export-components */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, Form } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProductionOrderAdminToolbar from './ProductionOrderAdminToolbar'
import ProductionOrderManagementLock from './ProductionOrderManagementLock'
import type { UnlockManagementFormValues } from './productionOrderPageUtils'

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))
vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ role: 'admin' }),
}))

function LockHarness({
  isUnlocking = false,
  onOpenPasswordModal,
  onUnlock,
}: {
  isUnlocking?: boolean
  onOpenPasswordModal: () => void
  onUnlock: (values: UnlockManagementFormValues) => void
}) {
  const [unlockForm] = Form.useForm<UnlockManagementFormValues>()

  return (
    <ProductionOrderManagementLock
      isUnlocking={isUnlocking}
      onOpenPasswordModal={onOpenPasswordModal}
      onUnlock={onUnlock}
      unlockForm={unlockForm}
    />
  )
}

function renderToolbar(
  overrides: Partial<Parameters<typeof ProductionOrderAdminToolbar>[0]> = {},
) {
  const handlers = {
    handleBatchAudit: vi.fn(),
    handleCreate: vi.fn(),
    handleDelete: vi.fn(),
    handleEdit: vi.fn(),
    handleExport: vi.fn(),
    handleLockManagement: vi.fn(),
    handleNightSnackExport: vi.fn(),
    onOpenPasswordModal: vi.fn(),
  }

  render(
    <App>
      <ProductionOrderAdminToolbar
        isBatchUpdating={false}
        isDeleting={false}
        isExporting={false}
        isNightSnackExporting={false}
        preloadProductionOrderExcel={vi.fn()}
        preloadProductionOrderNightSnackExcel={vi.fn()}
        selectedRowKeys={[]}
        total={3}
        {...handlers}
        {...overrides}
      />
    </App>,
  )

  return handlers
}

describe('生产工单管理锁定与工具栏回调', () => {
  afterEach(() => {
    cleanup()
  })

  it('锁定界面的修改密码按钮打开改密码弹窗', async () => {
    const user = userEvent.setup()
    const onOpenPasswordModal = vi.fn()

    render(
      <App>
        <LockHarness
          onOpenPasswordModal={onOpenPasswordModal}
          onUnlock={vi.fn()}
        />
      </App>,
    )

    await user.click(screen.getByRole('button', { name: /修改我的密码/ }))

    expect(onOpenPasswordModal).toHaveBeenCalledTimes(1)
  })

  it('锁定界面提交管理密码后回调 onUnlock', async () => {
    const user = userEvent.setup()
    const onUnlock = vi.fn()

    render(
      <App>
        <LockHarness onOpenPasswordModal={vi.fn()} onUnlock={onUnlock} />
      </App>,
    )

    await user.type(screen.getByPlaceholderText('请输入管理密码'), '123456')
    await user.click(screen.getByRole('button', { name: /解锁管理/ }))

    await waitFor(() =>
      expect(onUnlock).toHaveBeenCalledWith({ password: '123456' }),
    )
  })

  it('工具栏的批量审核、反审核与锁定按钮分别触发对应回调', async () => {
    const user = userEvent.setup()
    const handlers = renderToolbar()

    await user.click(screen.getByRole('button', { name: /批量审核/ }))
    expect(handlers.handleBatchAudit).toHaveBeenLastCalledWith(true)

    await user.click(screen.getByRole('button', { name: /批量反审核/ }))
    expect(handlers.handleBatchAudit).toHaveBeenLastCalledWith(false)

    await user.click(screen.getByRole('button', { name: /锁定/ }))
    expect(handlers.handleLockManagement).toHaveBeenCalledTimes(1)
  })

  it('工具栏的修改密码按钮调用 onOpenPasswordModal', async () => {
    const user = userEvent.setup()
    const handlers = renderToolbar()

    await user.click(screen.getByRole('button', { name: /修改密码/ }))

    expect(handlers.onOpenPasswordModal).toHaveBeenCalledTimes(1)
  })
})

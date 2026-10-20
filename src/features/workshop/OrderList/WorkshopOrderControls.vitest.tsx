import type { WorkshopOrderToolbarProps } from './WorkshopOrderToolbar'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'

import { afterEach, describe, expect, it, vi } from 'vitest'
import WorkshopOrderStatusTabs from './WorkshopOrderStatusTabs'
import WorkshopOrderToolbar from './WorkshopOrderToolbar'

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

function renderToolbar(overrides: Partial<WorkshopOrderToolbarProps> = {}) {
  const handlers = {
    handleCreate: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
    handleBatchStatusChange: vi.fn(),
    handlePrint: vi.fn(),
    handleExportExcel: vi.fn(),
    preloadWorkshopOrderPdf: vi.fn(),
    preloadExportAsExcel: vi.fn(),
  }

  render(
    <App>
      <WorkshopOrderToolbar
        canCreate
        canEdit
        canDelete
        canManageStatus
        viewerDenied={false}
        selectedCount={2}
        isBatchUpdating={false}
        isDeleting={false}
        isPrinting={false}
        isExporting={false}
        {...handlers}
        {...overrides}
      />
    </App>,
  )

  return handlers
}

describe('车间订单页面工具栏与状态页签', () => {
  afterEach(() => {
    cleanup()
  })

  it('批量状态按钮分别以生产中/已结案调用回调', async () => {
    const user = userEvent.setup()
    const handlers = renderToolbar()

    await user.click(screen.getByRole('button', { name: /批量改为生产中/ }))
    expect(handlers.handleBatchStatusChange).toHaveBeenLastCalledWith('生产中')

    await user.click(screen.getByRole('button', { name: /批量结案/ }))
    expect(handlers.handleBatchStatusChange).toHaveBeenLastCalledWith('已结案')
  })

  it('导出按钮显示选中数量并触发导出，无状态权限时隐藏批量状态按钮', async () => {
    const user = userEvent.setup()
    const handlers = renderToolbar({ canManageStatus: false })

    expect(screen.queryByRole('button', { name: /批量结案/ })).toBeNull()
    expect(screen.getByText('已选 2 项')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /导出Excel/ }))
    expect(handlers.handleExportExcel).toHaveBeenCalledTimes(1)
  })

  it('未选中订单时导出按钮禁用', () => {
    renderToolbar({ selectedCount: 0 })

    expect(
      screen
        .getByRole('button', { name: /导出Excel/ })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('状态页签切换时回调对应 key', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <WorkshopOrderStatusTabs
        activeTab="production"
        productionTotal={5}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('5')).toBeTruthy()

    await user.click(screen.getByText('已结案'))
    expect(onChange).toHaveBeenCalledWith('closed')
  })
})

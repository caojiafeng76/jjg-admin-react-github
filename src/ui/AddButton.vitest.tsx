import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AddButton from './AddButton'

const permissionState = vi.hoisted(() => ({
  allowed: true,
  viewerDenied: false,
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => permissionState.allowed,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: permissionState.viewerDenied,
    viewerOperationTip: '只读账号无操作权限',
  }),
}))

afterEach(() => {
  cleanup()
  permissionState.allowed = true
  permissionState.viewerDenied = false
})

describe('AddButton', () => {
  it('renders a primary button by default and triggers handleCreate', () => {
    const handleCreate = vi.fn()
    render(<AddButton handleCreate={handleCreate} />)

    const button = screen.getByRole('button', { name: /添加/ })
    expect(button.className).toContain('ant-btn-primary')
    fireEvent.click(button)
    expect(handleCreate).toHaveBeenCalledTimes(1)
  })

  it('supports variant="text" and custom label', () => {
    render(<AddButton handleCreate={vi.fn()} variant="text">新建工装</AddButton>)

    const button = screen.getByRole('button', { name: /新建工装/ })
    expect(button.className).toContain('ant-btn-text')
  })

  it('disables the button when permission is denied', () => {
    permissionState.allowed = false
    render(<AddButton handleCreate={vi.fn()} permissionKey="feature:demo.create" />)

    expect(screen.getByRole('button', { name: /添加/ })).toBeDisabled()
  })
})

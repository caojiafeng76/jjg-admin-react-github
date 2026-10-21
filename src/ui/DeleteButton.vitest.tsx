import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DeleteButton from './DeleteButton'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

afterEach(cleanup)

describe('DeleteButton', () => {
  it('derives the confirm title from itemName instead of defaulting to orders', async () => {
    render(
      <DeleteButton
        onConfirm={vi.fn()}
        isDeleting={false}
        count={2}
        itemName="规格"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /删除/ }))

    expect(await screen.findByText('删除规格')).toBeTruthy()
    expect(screen.getByText(/条规格吗/)).toBeTruthy()
    expect(screen.queryByText(/订单/)).toBeNull()
  })

  it('falls back to a neutral item name', async () => {
    render(<DeleteButton onConfirm={vi.fn()} isDeleting={false} />)

    fireEvent.click(screen.getByRole('button', { name: /删除/ }))

    expect(await screen.findByText('删除记录')).toBeTruthy()
  })

  it('uses a danger confirm button labelled 确认删除', async () => {
    const onConfirm = vi.fn()
    render(
      <DeleteButton onConfirm={onConfirm} isDeleting={false} count={1} itemName="工单" />,
    )

    fireEvent.click(screen.getByRole('button', { name: /删除/ }))
    const confirmButton = await screen.findByRole('button', { name: '确认删除' })

    expect(confirmButton.className).toContain('ant-btn-dangerous')
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

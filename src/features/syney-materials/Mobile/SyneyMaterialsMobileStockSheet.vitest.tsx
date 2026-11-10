import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SyneyMaterialsMobileStockSheet from './SyneyMaterialsMobileStockSheet'

const options = [
  { id: 'inv-1', material_name: '243-147', specification: '1060', unit: '块', quantity: 3 },
  { id: 'inv-2', material_name: '保护膜', specification: '370', unit: '卷', quantity: 0 },
]

const createMutation = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../Inventory/useSyneyMaterialsInventory', () => ({
  useSyneyMaterialsInventoryOptions: () => ({ data: options, isFetching: false }),
}))
vi.mock('../Stock/useSyneyMaterialsStock', () => ({
  useCreateSyneyMaterialsStock: () => createMutation,
}))

function renderSheet(props: Partial<Parameters<typeof SyneyMaterialsMobileStockSheet>[0]> = {}) {
  const onClose = vi.fn()
  render(
    <App>
      <SyneyMaterialsMobileStockSheet open direction="out" onClose={onClose} {...props} />
    </App>,
  )
  return { onClose }
}

function submitButton(label = '确认出库') {
  return screen.getByRole('button', { name: label })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('西尼材料手机端录入弹层', () => {
  it('未选材料时不能提交；从底部列表选中后显示当前库存', async () => {
    renderSheet()
    expect(submitButton()).toBeDisabled()

    fireEvent.click(screen.getByText('点击选择材料'))
    fireEvent.click(await screen.findByText('243-147 / 1060'))

    expect(await screen.findByText('当前库存 3 块')).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  it('出库超过库存时提示并禁用提交，减回去后恢复', async () => {
    renderSheet({ presetInventory: options[0] })

    const plus = screen.getByRole('button', { name: '增加数量' })
    fireEvent.click(plus)
    fireEvent.click(plus)
    fireEvent.click(plus)

    expect(await screen.findByText('库存不足，当前库存 3 块')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '减少数量' }))
    await waitFor(() => expect(screen.queryByText(/库存不足/)).toBeNull())
    expect(submitButton()).toBeEnabled()
  })

  it('从库存页带入时材料锁定，提交带上库存 ID 和数量', async () => {
    const { onClose } = renderSheet({ presetInventory: options[0] })

    expect(screen.queryByText('点击选择材料')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '增加数量' }))
    fireEvent.click(submitButton())

    await waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalledWith({
        inventory_id: 'inv-1',
        quantity: 2,
        remarks: '',
      }),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('入库不受当前库存限制', async () => {
    renderSheet({ direction: 'in', presetInventory: options[1] })

    fireEvent.click(screen.getByRole('button', { name: '增加数量' }))
    expect(screen.queryByText(/库存不足/)).toBeNull()
    expect(submitButton('确认入库')).toBeEnabled()
  })
})

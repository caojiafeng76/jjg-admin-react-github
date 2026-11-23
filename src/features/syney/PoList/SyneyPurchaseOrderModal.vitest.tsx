import type { SyneyPurchaseOrder } from '@/services/syneyDeliveryOrderContract'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syneyPoKeys } from '../queryKeys'
import { SyneyPurchaseOrderModal } from './SyneyPurchaseOrderModal'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  existing: vi.fn(),
  importOrder: vi.fn(),
}))

vi.mock('@/services/apiSyneyDeliveryOrder', () => ({ fetchSyneyPurchaseOrder: mocks.fetch }))
vi.mock('@/services/apiSyneyPurchaseOrder', () => ({
  getExistingSyneyProductionNos: mocks.existing,
  importSyneyPurchaseOrder: mocks.importOrder,
}))
vi.mock('../SpecList/useSyneySpecs', () => ({ useSyneySpecs: () => ({ syneySpecs: [] }) }))
vi.mock('../useSyneySafePartSettings', () => ({ useSyneySafePartSettings: () => ({ data: [] }) }))

const order: SyneyPurchaseOrder = {
  poNo: 'P001',
  rows: [1, 2].map(id => ({
    id,
    soNo: `SO-${id}`,
    endDate: '2026-10-28',
    partNo: 'XN2808AF998',
    partName: '后板',
    spec: '1000型',
    paramSpec: '',
    quantity: 1,
    unit: 'EA',
    remark: id === 1 ? '上头部 L1=648mm' : '下头部 L1=684mm',
    orderRemark: '',
  })),
}

function renderModal() {
  const client = new QueryClient()
  const onClose = vi.fn()
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
  render(
    <QueryClientProvider client={client}>
      <App>
        <SyneyPurchaseOrderModal onClose={onClose} onModeChange={vi.fn()} />
      </App>
    </QueryClientProvider>,
  )
  return { user: userEvent.setup(), onClose, invalidateQueries }
}

describe('按西尼采购单号生成订单', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.fetch.mockResolvedValue(order)
  })

  it('预览部分已建订单，确认提交并刷新西尼订单', async () => {
    mocks.existing.mockResolvedValue(new Set(['SO-1']))
    mocks.importOrder.mockResolvedValue({ created: 1, skipped: 1 })
    const { user, onClose, invalidateQueries } = renderModal()
    expect(screen.getByRole('radio', { name: '按单号获取' })).toBeChecked()
    await user.type(screen.getByRole('textbox', { name: '西尼采购单号' }), 'P001{Enter}')
    expect(await screen.findByText(/待创建 1 条，已存在 1 条/)).toBeInTheDocument()
    expect(screen.getByText('下头部 L1=684mm')).toBeInTheDocument()
    expect(mocks.importOrder).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '确认生成 1 条订单' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(mocks.importOrder.mock.calls[0][0]).toEqual({
      poNo: 'P001',
      groups: [expect.objectContaining({ soNo: 'SO-1' }), expect.objectContaining({ soNo: 'SO-2' })],
    })
    expect(invalidateQueries).toHaveBeenCalledWith(expect.objectContaining({ queryKey: syneyPoKeys.all }))
  })

  it('全部已建时禁用确认，更改单号后清除上次预览', async () => {
    mocks.existing.mockResolvedValue(new Set(['SO-1', 'SO-2']))
    const { user } = renderModal()
    const input = screen.getByRole('textbox', { name: '西尼采购单号' })
    await user.type(input, 'P001')
    await user.click(screen.getByRole('button', { name: '获取订单' }))
    expect(await screen.findByText(/该采购单已全部建单/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认生成' })).toBeDisabled()
    await user.type(input, '2')
    expect(screen.queryByText(/该采购单已全部建单/)).toBeNull()
    expect(screen.getByRole('button', { name: '确认生成' })).toBeDisabled()
  })
})

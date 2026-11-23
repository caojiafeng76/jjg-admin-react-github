import type { PoImportMode } from './PoImportMode'
import type { SyneyPurchaseOrder } from '@/services/syneyDeliveryOrderContract'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syneyPoKeys } from '../queryKeys'
import { SyneyPurchaseOrderModal } from './SyneyPurchaseOrderModal'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  existing: vi.fn(),
  importOrder: vi.fn(),
  specsError: null as Error | null,
  settingsData: [] as unknown[] | undefined,
}))

vi.mock('@/services/apiSyneyDeliveryOrder', () => ({ fetchSyneyPurchaseOrder: mocks.fetch }))
vi.mock('@/services/apiSyneyPurchaseOrder', () => ({
  getExistingSyneyProductionNos: mocks.existing,
  importSyneyPurchaseOrder: mocks.importOrder,
}))
vi.mock('../SpecList/useSyneySpecs', () => ({
  useAllSyneySpecs: () => ({ syneySpecs: mocks.specsError ? [] : [], error: mocks.specsError, isLoading: false }),
}))
vi.mock('../useSyneySafePartSettings', () => ({
  useSyneySafePartSettings: () => ({ data: mocks.settingsData, isLoading: false }),
}))

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

const loosePartsOrder: SyneyPurchaseOrder = {
  poNo: 'P202611100277',
  rows: [
    {
      id: 9705642,
      soNo: '',
      endDate: '2026-11-12',
      partNo: 'XN4025H3',
      partName: '人行道梳齿板',
      spec: '右件',
      paramSpec: '',
      quantity: 4,
      unit: 'EA',
      remark: 'GM261109007,售后熊剑波,',
      orderRemark: '售后熊剑波',
    },
    {
      id: 9705643,
      soNo: '',
      endDate: '2026-11-12',
      partNo: 'XN4025H2',
      partName: '人行道梳齿板',
      spec: '中间',
      paramSpec: '',
      quantity: 12,
      unit: 'EA',
      remark: 'GM261109007,售后熊剑波,',
      orderRemark: '售后熊剑波',
    },
  ],
}

function renderModal(initialMode: 'scm' | 'loose-parts' = 'scm') {
  const client = new QueryClient()
  const onClose = vi.fn()
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries')

  function Wrapper() {
    const [mode, setMode] = useState<PoImportMode>(initialMode)
    return (
      <QueryClientProvider client={client}>
        <App>
          <SyneyPurchaseOrderModal
            mode={mode === 'loose-parts' ? 'loose-parts' : 'scm'}
            onClose={onClose}
            onModeChange={setMode}
          />
        </App>
      </QueryClientProvider>
    )
  }

  render(<Wrapper />)
  return { user: userEvent.setup(), onClose, invalidateQueries }
}

describe('按西尼采购单号生成订单', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.specsError = null
    mocks.settingsData = []
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
      groups: [
        expect.objectContaining({ soNo: 'SO-1', isLooseParts: false }),
        expect.objectContaining({ soNo: 'SO-2', isLooseParts: false }),
      ],
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

  it('导入散件模式不依赖踏板规格和件号配置，直接生成散件订单', async () => {
    mocks.specsError = new Error('specs failed')
    mocks.settingsData = undefined
    mocks.fetch.mockResolvedValue(loosePartsOrder)
    mocks.existing.mockResolvedValue(new Set())
    mocks.importOrder.mockResolvedValue({ created: 1, skipped: 0 })

    const { user, onClose } = renderModal('loose-parts')
    expect(screen.getByRole('radio', { name: '导入散件' })).toBeChecked()
    await user.type(screen.getByRole('textbox', { name: '西尼采购单号' }), 'P202611100277{Enter}')
    expect(await screen.findByText('P202611100277（无生产编号）')).toBeInTheDocument()
    expect(screen.getByText('规格 散件')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认生成 1 条散件订单' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(mocks.importOrder.mock.calls[0][0]).toEqual({
      poNo: 'P202611100277',
      groups: [
        expect.objectContaining({
          soNo: '',
          spec: '散件',
          brand: null,
          technique: null,
          isLooseParts: true,
        }),
      ],
    })
  })

  it('按单号获取查到无生产编号的散件单时提示并支持一键切换复用预览', async () => {
    mocks.fetch.mockResolvedValue(loosePartsOrder)
    mocks.existing.mockResolvedValue(new Set())
    mocks.importOrder.mockResolvedValue({ created: 1, skipped: 0 })

    const { user, onClose } = renderModal('scm')
    await user.type(screen.getByRole('textbox', { name: '西尼采购单号' }), 'P202611100277')
    await user.click(screen.getByRole('button', { name: '获取订单' }))

    expect(await screen.findByText('该采购单无生产编号，属于散件订单')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认生成 1 条订单' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '切换为导入散件' }))
    expect(screen.getByRole('radio', { name: '导入散件' })).toBeChecked()
    // 直接复用已拉取数据，无需再次请求 SCM
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('规格 散件')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '确认生成 1 条散件订单' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})

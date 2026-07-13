import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

const handleApiErrorMock = vi.hoisted(() =>
  vi.fn((error: unknown, message: string) => {
    const detail = error instanceof Error ? `: ${error.message}` : ''
    return new Error(`${message}${detail}`)
  }),
)

vi.mock('./supabase', () => ({ default: supabaseMock }))

vi.mock('@utils/errorHandler', () => ({
  handleApiError: handleApiErrorMock,
}))

import { getSyneyPoDetail, updatePoItems } from './apiSyneyPo'

const detailQueryMock = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    abortSignal: vi.fn(),
    single: vi.fn(),
  }

  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.abortSignal.mockReturnValue(query)

  return query
})

describe('getSyneyPoDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    detailQueryMock.select.mockReturnValue(detailQueryMock)
    detailQueryMock.eq.mockReturnValue(detailQueryMock)
    detailQueryMock.abortSignal.mockReturnValue(detailQueryMock)
    supabaseMock.from.mockReturnValue(detailQueryMock)
  })

  it('loads the complete detail shape with the supplied abort signal', async () => {
    const signal = new AbortController().signal
    const detail = { id: 759, items: [{ id: 101 }] }
    detailQueryMock.single.mockResolvedValue({ data: detail, error: null })

    await expect(getSyneyPoDetail('759', signal)).resolves.toEqual(detail)

    expect(supabaseMock.from).toHaveBeenCalledWith('syney-pos')
    expect(detailQueryMock.select).toHaveBeenCalledWith(
      '*, items:syney-po-items(*)',
    )
    expect(detailQueryMock.eq).toHaveBeenCalledWith('id', 759)
    expect(detailQueryMock.abortSignal).toHaveBeenCalledWith(signal)
    expect(detailQueryMock.single).toHaveBeenCalledOnce()
  })

  it('preserves the not-found error message', async () => {
    detailQueryMock.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })

    await expect(getSyneyPoDetail('759')).rejects.toThrow(
      '采购单不存在或已被删除',
    )
    expect(handleApiErrorMock).not.toHaveBeenCalled()
  })
})

describe('updatePoItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock.rpc.mockResolvedValue({ data: 1, error: null })
  })

  it('updates items and missing specifications through one atomic RPC call', async () => {
    await updatePoItems({
      ids: [101, 102],
      values: {
        PartNo: 'XN2808EB',
        PartName: '前沿板',
        Spec: '1000型',
        ParamSpec: 'A=123',
        Remark: '备注',
      },
    })

    expect(supabaseMock.rpc).toHaveBeenCalledOnce()
    expect(supabaseMock.rpc).toHaveBeenCalledWith('update_syney_po_items', {
      p_ids: [101, 102],
      p_values: {
        ParamSpec: 'A=123',
        PartName: '前沿板',
        PartNo: 'XN2808EB',
        Remark: '备注',
        Spec: '1000型',
      },
    })
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('omits unsupported and undefined fields while preserving explicit null', async () => {
    await updatePoItems({
      ids: [101],
      values: {
        id: 999,
        created_at: '2026-07-13T00:00:00Z',
        ParamSpecInferred: true,
        PartName: undefined,
        PartNo: null,
        Remark: null,
        TaxTotalPrice: 100,
      },
    })

    expect(supabaseMock.rpc).toHaveBeenCalledWith('update_syney_po_items', {
      p_ids: [101],
      p_values: {
        PartNo: null,
        Remark: null,
      },
    })
  })

  it('maps an RPC error through the shared API error handler', async () => {
    const rpcError = new Error('transaction failed')
    supabaseMock.rpc.mockResolvedValue({ data: null, error: rpcError })

    await expect(
      updatePoItems({ ids: [101], values: { Remark: '备注' } }),
    ).rejects.toThrow('订单详情更新失败: transaction failed')

    expect(handleApiErrorMock).toHaveBeenCalledWith(
      rpcError,
      '订单详情更新失败',
    )
    expect(supabaseMock.rpc).toHaveBeenCalledOnce()
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })
})

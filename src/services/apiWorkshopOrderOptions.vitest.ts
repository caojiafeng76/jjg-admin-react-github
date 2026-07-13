import { beforeEach, describe, expect, it, vi } from 'vitest'

const { abortSignalMock, rpcMock, singleMock } = vi.hoisted(() => ({
  abortSignalMock: vi.fn(),
  rpcMock: vi.fn(),
  singleMock: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: {
    rpc: rpcMock,
  },
}))

import { getWorkshopOrderOptions } from './apiWorkshopOrders'

describe('getWorkshopOrderOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const builder = {
      abortSignal: abortSignalMock,
      single: singleMock,
    }

    rpcMock.mockReturnValue(builder)
    abortSignalMock.mockReturnValue(builder)
    singleMock.mockResolvedValue({
      data: {
        project_nos: ['P-1', 'P-2'],
        product_models: ['M-1'],
        lengths: [900, 1200],
      },
      error: null,
    })
  })

  it('loads all three option lists with one cancellable RPC request', async () => {
    const signal = new AbortController().signal

    await expect(getWorkshopOrderOptions(signal)).resolves.toEqual({
      projectNos: ['P-1', 'P-2'],
      productModels: ['M-1'],
      lengths: [900, 1200],
    })

    expect(rpcMock).toHaveBeenCalledOnce()
    expect(rpcMock).toHaveBeenCalledWith('get_workshop_order_options')
    expect(abortSignalMock).toHaveBeenCalledWith(signal)
    expect(singleMock).toHaveBeenCalledOnce()
  })

  it('normalizes nullable response arrays to empty collections', async () => {
    singleMock.mockResolvedValue({
      data: {
        project_nos: null,
        product_models: null,
        lengths: null,
      },
      error: null,
    })

    await expect(getWorkshopOrderOptions()).resolves.toEqual({
      projectNos: [],
      productModels: [],
      lengths: [],
    })
  })

  it('maps RPC failures through the shared API error handler', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    })

    await expect(getWorkshopOrderOptions()).rejects.toMatchObject({
      message: '没有权限执行当前操作',
      code: '42501',
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutationMock = vi.hoisted(() =>
  vi.fn(
    (options: { invalidateQueries: readonly (readonly string[])[] }) => options,
  ),
)
vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: mutationMock,
}))

import { jintanKeys } from '../queryKeys'
import {
  useCreateJintanPartsStockOut,
  useDeleteJintanPartsStockOut,
  useUpdateJintanPartsStockOutRemarks,
} from './useJintanPartsStockOut'

describe('配件出库缓存联动', () => {
  beforeEach(() => mutationMock.mockClear())

  it('新增和删除后刷新出库列表及库存', () => {
    useCreateJintanPartsStockOut()
    useDeleteJintanPartsStockOut()
    for (const [options] of mutationMock.mock.calls) {
      expect(options.invalidateQueries).toEqual([
        jintanKeys.partsStockOut.all,
        jintanKeys.partsInventory.all,
      ])
    }
  })

  it('修改备注只刷新出库列表', () => {
    useUpdateJintanPartsStockOutRemarks()
    expect(mutationMock.mock.calls[0][0].invalidateQueries).toEqual([
      jintanKeys.partsStockOut.all,
    ])
  })
})

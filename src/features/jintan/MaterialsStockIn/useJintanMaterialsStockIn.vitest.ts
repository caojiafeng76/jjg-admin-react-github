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
  useCreateJintanMaterialsStockIn,
  useDeleteJintanMaterialsStockIn,
  useUpdateJintanMaterialsStockInRemarks,
} from './useJintanMaterialsStockIn'

describe('素材入库缓存联动', () => {
  beforeEach(() => mutationMock.mockClear())

  it('新增和删除后刷新入库列表及库存', () => {
    useCreateJintanMaterialsStockIn()
    useDeleteJintanMaterialsStockIn()
    for (const [options] of mutationMock.mock.calls) {
      expect(options.invalidateQueries).toEqual([
        jintanKeys.materialsStockIn.all,
        jintanKeys.materialsInventory.all,
      ])
    }
  })

  it('修改备注只刷新入库列表', () => {
    useUpdateJintanMaterialsStockInRemarks()
    expect(mutationMock.mock.calls[0][0].invalidateQueries).toEqual([
      jintanKeys.materialsStockIn.all,
    ])
  })
})

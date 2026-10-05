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
  useCreateJintanProfilesStockIn,
  useDeleteJintanProfilesStockIn,
  useUpdateJintanProfilesStockInRemarks,
} from './useJintanProfilesStockIn'

describe('型材入库缓存联动', () => {
  beforeEach(() => mutationMock.mockClear())

  it('新增和删除后刷新入库列表及库存', () => {
    useCreateJintanProfilesStockIn()
    useDeleteJintanProfilesStockIn()
    for (const [options] of mutationMock.mock.calls) {
      expect(options.invalidateQueries).toEqual([
        jintanKeys.profilesStockIn.all,
        jintanKeys.profilesInventory.all,
      ])
    }
  })

  it('修改备注只刷新入库列表', () => {
    useUpdateJintanProfilesStockInRemarks()
    expect(mutationMock.mock.calls[0][0].invalidateQueries).toEqual([
      jintanKeys.profilesStockIn.all,
    ])
  })
})

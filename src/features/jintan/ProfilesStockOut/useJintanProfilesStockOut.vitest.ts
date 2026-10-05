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
  useCreateJintanProfilesStockOut,
  useDeleteJintanProfilesStockOut,
  useUpdateJintanProfilesStockOutRemarks,
} from './useJintanProfilesStockOut'

describe('型材出库缓存联动', () => {
  beforeEach(() => mutationMock.mockClear())

  it('新增和删除后刷新出库列表及库存', () => {
    useCreateJintanProfilesStockOut()
    useDeleteJintanProfilesStockOut()
    for (const [options] of mutationMock.mock.calls) {
      expect(options.invalidateQueries).toEqual([
        jintanKeys.profilesStockOut.all,
        jintanKeys.profilesInventory.all,
      ])
    }
  })

  it('修改备注只刷新出库列表', () => {
    useUpdateJintanProfilesStockOutRemarks()
    expect(mutationMock.mock.calls[0][0].invalidateQueries).toEqual([
      jintanKeys.profilesStockOut.all,
    ])
  })
})

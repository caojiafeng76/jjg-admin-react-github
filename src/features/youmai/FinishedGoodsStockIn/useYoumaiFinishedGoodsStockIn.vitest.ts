import { beforeEach, describe, expect, it, vi } from 'vitest'

import { youmaiKeys } from '../queryKeys'
import {
  useBatchUpdateYoumaiFinishedGoodsStockInStatus,
  useCreateYoumaiFinishedGoodsStockIn,
  useDeleteYoumaiFinishedGoodsStockIn,
  useUpdateYoumaiFinishedGoodsStockIn,
} from './useYoumaiFinishedGoodsStockIn'

const mutationMock = vi.hoisted(() =>
  vi.fn(
    (options: { invalidateQueries: readonly (readonly string[])[] }) => options,
  ),
)
vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: mutationMock,
}))

describe('优迈成品入库缓存联动', () => {
  beforeEach(() => mutationMock.mockClear())

  it('新建、编辑、批量审核和删除后同时刷新入库列表、库存与出库列表', () => {
    useCreateYoumaiFinishedGoodsStockIn()
    useUpdateYoumaiFinishedGoodsStockIn()
    useBatchUpdateYoumaiFinishedGoodsStockInStatus()
    useDeleteYoumaiFinishedGoodsStockIn()

    expect(mutationMock).toHaveBeenCalledTimes(4)
    for (const [options] of mutationMock.mock.calls) {
      expect(options.invalidateQueries).toEqual([
        youmaiKeys.finishedGoodsStockIn.all,
        youmaiKeys.finishedGoodsInventory.all,
        youmaiKeys.finishedGoodsStockOut.all,
      ])
    }
  })
})

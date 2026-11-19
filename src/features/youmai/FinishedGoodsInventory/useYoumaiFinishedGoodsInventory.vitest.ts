import { describe, expect, it, vi } from 'vitest'

import { youmaiKeys } from '../queryKeys'
import { useAdjustYoumaiFinishedGoodsInventory } from './useYoumaiFinishedGoodsInventory'

const mutationMock = vi.hoisted(() =>
  vi.fn(
    (options: { invalidateQueries: readonly (readonly string[])[] }) => options,
  ),
)
vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: mutationMock,
}))

describe('优迈成品库存缓存联动', () => {
  it('调整库存后同时刷新库存与出库列表', () => {
    useAdjustYoumaiFinishedGoodsInventory()

    expect(mutationMock.mock.calls[0][0].invalidateQueries).toEqual([
      youmaiKeys.finishedGoodsInventory.all,
      youmaiKeys.finishedGoodsStockOut.all,
    ])
  })
})

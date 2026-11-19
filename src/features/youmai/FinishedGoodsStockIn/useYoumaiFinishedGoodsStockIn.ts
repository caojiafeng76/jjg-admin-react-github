import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdateYoumaiFinishedGoodsStockInStatus,
  createYoumaiFinishedGoodsStockIn,
  deleteYoumaiFinishedGoodsStockIn,
  getYoumaiFinishedGoodsStockInList,
  getYoumaiProductDataOptions,
  updateYoumaiFinishedGoodsStockIn,
} from '@/services/apiYoumaiFinishedGoodsStockIn'

import { youmaiKeys } from '../queryKeys'

const YOUMAI_FINISHED_GOODS_STOCK_IN_KEY
  = 'youmai-finished-goods-stock-in' as const
const YOUMAI_FINISHED_GOODS_INVENTORY_KEY
  = 'youmai-finished-goods-inventory' as const
const YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY
  = 'youmai-finished-goods-stock-out' as const

/** 入库单变动会影响库存行，出库列表实时读取 final_stock，需一并刷新 */
const STOCK_IN_MUTATION_INVALIDATE_KEYS = [
  [YOUMAI_FINISHED_GOODS_STOCK_IN_KEY],
  [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
  [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
]

export function useYoumaiFinishedGoodsStockInList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
    status?: '待审核' | '已审核'
  }
}) {
  return useQuery({
    queryKey: [
      YOUMAI_FINISHED_GOODS_STOCK_IN_KEY,
      page,
      pageSize,
      searchParams,
    ],
    queryFn: () =>
      getYoumaiFinishedGoodsStockInList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        status: searchParams.status,
      }),
    placeholderData: keepPreviousData,
    // 不抛错到 ErrorBoundary，让列表页用 TableState 展示错误态 + 重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useYoumaiProductDataOptions(keyword?: string) {
  const normalizedKeyword = keyword?.trim()

  return useQuery({
    queryKey: youmaiKeys.productData.options(normalizedKeyword),
    queryFn: ({ signal }) =>
      getYoumaiProductDataOptions(normalizedKeyword, signal),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiFinishedGoodsStockIn,
    invalidateQueries: STOCK_IN_MUTATION_INVALIDATE_KEYS,
  })
}

export function useUpdateYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiFinishedGoodsStockIn,
    invalidateQueries: STOCK_IN_MUTATION_INVALIDATE_KEYS,
  })
}

export function useBatchUpdateYoumaiFinishedGoodsStockInStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateYoumaiFinishedGoodsStockInStatus,
    invalidateQueries: STOCK_IN_MUTATION_INVALIDATE_KEYS,
  })
}

export function useDeleteYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiFinishedGoodsStockIn,
    invalidateQueries: STOCK_IN_MUTATION_INVALIDATE_KEYS,
  })
}

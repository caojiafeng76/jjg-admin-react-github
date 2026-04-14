import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiFinishedGoodsStockIn,
  deleteYoumaiFinishedGoodsStockIn,
  getYoumaiFinishedGoodsStockInList,
  getYoumaiProductDataOptions,
  updateYoumaiFinishedGoodsStockIn,
} from '@/services/apiYoumaiFinishedGoodsStockIn'

const YOUMAI_FINISHED_GOODS_STOCK_IN_KEY =
  'youmai-finished-goods-stock-in' as const
const YOUMAI_FINISHED_GOODS_INVENTORY_KEY =
  'youmai-finished-goods-inventory' as const
const YOUMAI_PRODUCT_DATA_OPTIONS_KEY = 'youmai-product-data-options' as const

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
    ...queryConfig.list,
  })
}

export function useYoumaiProductDataOptions() {
  return useQuery({
    queryKey: [YOUMAI_PRODUCT_DATA_OPTIONS_KEY],
    queryFn: () => getYoumaiProductDataOptions(),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiFinishedGoodsStockIn,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_IN_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useUpdateYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiFinishedGoodsStockIn,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_IN_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useDeleteYoumaiFinishedGoodsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiFinishedGoodsStockIn,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_IN_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

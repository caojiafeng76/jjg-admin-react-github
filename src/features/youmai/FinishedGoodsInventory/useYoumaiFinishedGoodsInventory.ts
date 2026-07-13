import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiFinishedGoodsInventory,
  deleteYoumaiFinishedGoodsInventory,
  getYoumaiFinishedGoodsInventoryList,
  getYoumaiProductDataOptions,
  importYoumaiFinishedGoodsInventory,
  updateYoumaiFinishedGoodsInventory,
} from '@/services/apiYoumaiFinishedGoodsInventory'

import { youmaiKeys } from '../queryKeys'

const YOUMAI_FINISHED_GOODS_INVENTORY_KEY =
  'youmai-finished-goods-inventory' as const

export function useYoumaiFinishedGoodsInventoryList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
  }
}) {
  return useQuery({
    queryKey: [
      YOUMAI_FINISHED_GOODS_INVENTORY_KEY,
      page,
      pageSize,
      searchParams,
    ],
    queryFn: () =>
      getYoumaiFinishedGoodsInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
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

export function useCreateYoumaiFinishedGoodsInventory() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiFinishedGoodsInventory,
    invalidateQueries: [[YOUMAI_FINISHED_GOODS_INVENTORY_KEY]],
  })
}

export function useUpdateYoumaiFinishedGoodsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiFinishedGoodsInventory,
    invalidateQueries: [[YOUMAI_FINISHED_GOODS_INVENTORY_KEY]],
  })
}

export function useImportYoumaiFinishedGoodsInventory() {
  return useMutationWithInvalidation({
    mutationFn: importYoumaiFinishedGoodsInventory,
    invalidateQueries: [[YOUMAI_FINISHED_GOODS_INVENTORY_KEY]],
  })
}

export function useDeleteYoumaiFinishedGoodsInventory() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiFinishedGoodsInventory,
    invalidateQueries: [[YOUMAI_FINISHED_GOODS_INVENTORY_KEY]],
  })
}

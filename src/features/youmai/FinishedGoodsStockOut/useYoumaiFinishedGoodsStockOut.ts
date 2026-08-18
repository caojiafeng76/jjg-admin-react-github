import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdateYoumaiFinishedGoodsStockOutStatus,
  createYoumaiFinishedGoodsStockOut,
  deleteYoumaiFinishedGoodsStockOut,
  getYoumaiFinishedGoodsStockOutList,
  getYoumaiProductDataOptions,
  importYoumaiFinishedGoodsStockOut,
  updateYoumaiFinishedGoodsStockOut,
} from '@/services/apiYoumaiFinishedGoodsStockOut'

import { youmaiKeys } from '../queryKeys'

const YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY =
  'youmai-finished-goods-stock-out' as const
const YOUMAI_FINISHED_GOODS_INVENTORY_KEY =
  'youmai-finished-goods-inventory' as const

export function useYoumaiFinishedGoodsStockOutList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    purchaseOrderNo?: string
    materialCode?: string
    materialName?: string
    model?: string
    specification?: string
    remarks?: string
    status?: '待审核' | '已审核'
  }
}) {
  return useQuery({
    queryKey: [
      YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY,
      page,
      pageSize,
      searchParams,
    ],
    queryFn: () =>
      getYoumaiFinishedGoodsStockOutList({
        page,
        pageSize,
        purchaseOrderNo: searchParams.purchaseOrderNo,
        materialCode: searchParams.materialCode,
        materialName: searchParams.materialName,
        model: searchParams.model,
        specification: searchParams.specification,
        remarks: searchParams.remarks,
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

export function useCreateYoumaiFinishedGoodsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiFinishedGoodsStockOut,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useUpdateYoumaiFinishedGoodsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiFinishedGoodsStockOut,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useBatchUpdateYoumaiFinishedGoodsStockOutStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateYoumaiFinishedGoodsStockOutStatus,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useImportYoumaiFinishedGoodsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: importYoumaiFinishedGoodsStockOut,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

export function useDeleteYoumaiFinishedGoodsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiFinishedGoodsStockOut,
    invalidateQueries: [
      [YOUMAI_FINISHED_GOODS_STOCK_OUT_KEY],
      [YOUMAI_FINISHED_GOODS_INVENTORY_KEY],
    ],
  })
}

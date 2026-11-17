import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getYoumaiFinishedGoodsInventoryByProductDataId } from '@/services/apiYoumaiFinishedGoodsInventory'
import { getYoumaiFinishedGoodsInventoryAdjustmentList } from '@/services/apiYoumaiFinishedGoodsInventoryAdjustments'
import { getYoumaiFinishedGoodsStockInList } from '@/services/apiYoumaiFinishedGoodsStockIn'
import { getYoumaiFinishedGoodsStockOutList } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { youmaiKeys } from '../queryKeys'

/** 行详情抽屉内流水记录每页条数 */
export const YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE = 10

/** 单个优迈货品的成品库存摘要 */
export function useYoumaiFinishedGoodsInventoryDetail(productDataId?: string) {
  return useQuery({
    queryKey: youmaiKeys.finishedGoodsInventory.detail(productDataId ?? ''),
    queryFn: ({ signal }) =>
      getYoumaiFinishedGoodsInventoryByProductDataId(
        productDataId as string,
        signal,
      ),
    enabled: Boolean(productDataId),
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个优迈货品的成品入库记录 */
export function useYoumaiFinishedGoodsStockInRecords({
  productDataId,
  page,
  pageSize = YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  productDataId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: youmaiKeys.finishedGoodsStockIn.byProduct({
      productDataId: productDataId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getYoumaiFinishedGoodsStockInList({
        page,
        pageSize,
        productDataId,
        signal,
      }),
    enabled: enabled && Boolean(productDataId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个优迈货品的成品出库记录 */
export function useYoumaiFinishedGoodsStockOutRecords({
  productDataId,
  page,
  pageSize = YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  productDataId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: youmaiKeys.finishedGoodsStockOut.byProduct({
      productDataId: productDataId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getYoumaiFinishedGoodsStockOutList({
        page,
        pageSize,
        productDataId,
        signal,
      }),
    enabled: enabled && Boolean(productDataId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个优迈货品的成品库存调整记录 */
export function useYoumaiFinishedGoodsAdjustmentRecords({
  productDataId,
  page,
  pageSize = YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  productDataId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: youmaiKeys.finishedGoodsInventory.adjustments({
      productDataId: productDataId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getYoumaiFinishedGoodsInventoryAdjustmentList({
        productDataId: productDataId as string,
        page,
        pageSize,
        signal,
      }),
    enabled: enabled && Boolean(productDataId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

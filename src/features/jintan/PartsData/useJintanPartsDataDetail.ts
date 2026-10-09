import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getJintanPartsInventoryByDataId } from '@/services/apiJintanPartsInventory'
import { getJintanPartsStockInList } from '@/services/apiJintanPartsStockIn'
import { getJintanPartsStockOutList } from '@/services/apiJintanPartsStockOut'
import { jintanKeys } from '../queryKeys'

/** 行详情抽屉内出入库记录每页条数 */
export const JINTAN_PARTS_DETAIL_RECORDS_PAGE_SIZE = 10

/**
 * 单个配件的库存摘要
 *
 * 查询键挂在 `jintan-parts-inventory` 根下，出入库 mutation 失效库存根后自动刷新。
 */
export function useJintanPartsInventoryDetail(partDataId?: string) {
  return useQuery({
    queryKey: jintanKeys.partsInventory.detail(partDataId ?? ''),
    queryFn: ({ signal }) =>
      getJintanPartsInventoryByDataId(partDataId as string, signal),
    enabled: Boolean(partDataId),
    // 不抛到 ErrorBoundary，由抽屉内展示错误与重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个配件的入库记录（挂在 `jintan-parts-stock-in` 根下，沿用现有失效链） */
export function useJintanPartsStockInRecords({
  inventoryId,
  page,
  pageSize = JINTAN_PARTS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.partsStockIn.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanPartsStockInList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个配件的出库记录（挂在 `jintan-parts-stock-out` 根下，沿用现有失效链） */
export function useJintanPartsStockOutRecords({
  inventoryId,
  page,
  pageSize = JINTAN_PARTS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.partsStockOut.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanPartsStockOutList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

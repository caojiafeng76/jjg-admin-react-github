import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getJintanMaterialsInventoryByDataId } from '@/services/apiJintanMaterialsInventory'
import { getJintanMaterialsStockInList } from '@/services/apiJintanMaterialsStockIn'
import { getJintanMaterialsStockOutList } from '@/services/apiJintanMaterialsStockOut'
import { jintanKeys } from '../queryKeys'

/** 行详情抽屉内出入库记录每页条数 */
export const JINTAN_MATERIALS_DETAIL_RECORDS_PAGE_SIZE = 10

/**
 * 单个素材的库存摘要
 *
 * 查询键挂在 `jintan-materials-inventory` 根下，出入库 mutation 失效库存根后自动刷新。
 */
export function useJintanMaterialsInventoryDetail(materialDataId?: string) {
  return useQuery({
    queryKey: jintanKeys.materialsInventory.detail(materialDataId ?? ''),
    queryFn: ({ signal }) =>
      getJintanMaterialsInventoryByDataId(materialDataId as string, signal),
    enabled: Boolean(materialDataId),
    // 不抛到 ErrorBoundary，由抽屉内展示错误与重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个素材的入库记录（挂在 `jintan-materials-stock-in` 根下，沿用现有失效链） */
export function useJintanMaterialsStockInRecords({
  inventoryId,
  page,
  pageSize = JINTAN_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.materialsStockIn.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanMaterialsStockInList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 单个素材的出库记录（挂在 `jintan-materials-stock-out` 根下，沿用现有失效链） */
export function useJintanMaterialsStockOutRecords({
  inventoryId,
  page,
  pageSize = JINTAN_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  enabled = true,
}: {
  inventoryId?: string
  page: number
  pageSize?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: jintanKeys.materialsStockOut.byInventory({
      inventoryId: inventoryId ?? '',
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanMaterialsStockOutList({ page, pageSize, inventoryId, signal }),
    enabled: enabled && Boolean(inventoryId),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}
